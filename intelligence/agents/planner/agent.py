"""Planner — parses analysis + target into a structured Bright Data research plan."""

import json
import logging

from langchain_core.messages import HumanMessage
from intelligence.agents.base.llm import get_llm_response
from intelligence.agents.base.json_parse import extract_json

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, AnalysisState, ResearchStep
from backend.config.config import settings

log = logging.getLogger(__name__)

_SYSTEM = """You are the Planner agent in StratOS AI, a market intelligence platform.
Your job: design a precise research plan for the given analysis and target.

Available Bright Data tools:
- serp_search      Google organic search. Best for: general intel, market data, company overview.
- serp_news        Google News search. Best for: recent events, press releases, announcements.
- mcp_search       MCP Server structured search. Best for: tech company data, product info.
- mcp_scrape       MCP Server page scrape (returns clean Markdown). Best for: specific pages.
- unlocker_fetch   Web Unlocker (bypasses bot protection). Best for: paywalled/protected pages.
- scraper_linkedin Web Scraper API — LinkedIn PERSON profile only (URL must be linkedin.com/in/...).
- browser_render   Scraping Browser (full JS rendering). Best for: SPAs, dynamic pricing pages.

Analysis types and research focus:
- account_pulse   GTM intel: competitor moves, funding rounds, leadership changes, product launches
- supplier_watch  Supply chain: financial health, risk signals, market position, contract risk
- threat_surface  Security: breach history, CVEs, threat intel, dark web exposure, domain risk

Rules:
1. Produce exactly 5 steps.
2. Use ALL 5 Bright Data products: serp_api (serp_search/serp_news), mcp_server (mcp_search/mcp_scrape),
   web_unlocker (unlocker_fetch), web_scraper_api (scraper_linkedin), scraping_browser (browser_render).
3. For scraper_linkedin: provide the REAL, EXISTING LinkedIn person profile URL of the company's
   current CEO or founder. Use your training knowledge — do NOT construct or guess URLs.
   Known examples (use these exactly if the target matches):
     Wix.com      → https://www.linkedin.com/in/avishai-abrahami-2730434/
     Shopify      → https://www.linkedin.com/in/tobiasluetke/
     Salesforce   → https://www.linkedin.com/in/marcbenioff/
     Microsoft    → https://www.linkedin.com/in/satyanadella/
     Google       → https://www.linkedin.com/in/sundarpichai/
     HubSpot      → https://www.linkedin.com/in/yamini-rangan/
     Atlassian    → https://www.linkedin.com/in/scottfarquhar/
     Figma        → https://www.linkedin.com/in/dylanfield/
     TSMC         → https://www.linkedin.com/in/cc-wei-90b8b41b1/
     Uber         → https://www.linkedin.com/in/dkhosrowshahi/
     Anthropic    → https://www.linkedin.com/in/dario-amodei-3934934/
     OpenAI       → https://www.linkedin.com/in/samaltman/
     NVIDIA       → https://www.linkedin.com/in/jenhsunhuang/
     ASML         → https://www.linkedin.com/in/christophefouquet/
     Lyft         → https://www.linkedin.com/in/davidrisher/
     Stripe       → https://www.linkedin.com/in/patrickcollison/
     Okta         → https://www.linkedin.com/in/toddmckinnon/
     Boeing       → https://www.linkedin.com/in/kelly-ortberg/
   For other targets, use the actual CEO's LinkedIn URL from your knowledge.
4. For browser_render: choose a dynamic page appropriate to the analysis type:
   - account_pulse  → the target's /pricing page (live pricing tiers, packaging changes)
   - supplier_watch → the target's investor relations or /investors page (financial data, IR calendar)
   - threat_surface → the target's /security or /trust or /safety page (bug bounty, disclosure policy)
   For known companies where the IR/security URL is non-standard, use the real URL:
     TSMC supplier_watch   → https://investor.tsmc.com/english
     ASML supplier_watch   → https://www.asml.com/en/investors/
     Boeing supplier_watch → https://investors.boeing.com
     Uber threat_surface   → https://www.uber.com/global/en/safety/
     Okta threat_surface   → https://trust.okta.com
5. For unlocker_fetch: target a page likely behind bot protection (press/news, paywalled IR filings).
   For threat_surface, prefer company security advisory pages or government enforcement records.
   Do NOT use haveibeenpwned.com/DomainSearch — it requires authentication and returns an auth wall.
6. For threat_surface analyses, SERP queries MUST be target-anchored. Use keyword-based patterns
   (do NOT use compound site: operators — they break SERP). Generate at least 2 of:
   - Security press:
     `{target} data breach hack security incident bleepingcomputer securityweek krebs 2022 2023 2024`
   - Historical incidents (include all years back to 2020):
     `{target} hack breach credentials leaked 2020 2021 2022 2023 2024 2025`
   - Bug bounty and disclosure:
     `{target} bug bounty HackerOne vulnerability disclosure responsible disclosure`
   - Regulatory and enforcement:
     `{target} FTC SEC GDPR data breach fine settlement enforcement lawsuit`
   - Named threat actors (if applicable):
     `{target} Lapsus ransomware supply chain attack APT threat actor`
   DO NOT use site:nvd.nist.gov — NVD indexes software CVEs, not company incidents.
   DO NOT use compound site: operators (site:A.com OR site:B.com) — use plain keywords instead.
   NEVER produce queries that omit the target name.
7. SERP query length hard limit: every serp_search and serp_news query must be 8 words or fewer.
   Long queries (10+ words) return empty results from SERP APIs — keep them short and keyword-dense.
   BAD:  "Okta Lapsus hack breach credentials leaked HAR file MFA bypass Cloudflare Twilio 2022 2023 2024"
   GOOD: "Okta Lapsus breach 2022 credentials leaked"
   BAD:  "Stripe EU UK regulatory compliance pricing changes contract risk 2024 2025"
   GOOD: "Stripe regulatory EU UK compliance 2024"
8. Queries and URLs must be specific to the actual target — no placeholders.

Respond with ONLY the JSON object/array. No preamble, no explanation, no markdown code fences, no text before or after the JSON.
[
  {"step": 1, "goal": "...", "tool": "serp_search", "query_or_url": "...", "result": null, "ok": null},
  ...
]"""


# Products that must appear in every plan, mapped to which tools cover them.
_REQUIRED_PRODUCTS: dict[str, set[str]] = {
    "serp_api": {"serp_search", "serp_news"},
    "mcp_server": {"mcp_search", "mcp_scrape"},
    "web_unlocker": {"unlocker_fetch"},
    "web_scraper_api": {"scraper_linkedin"},
    "scraping_browser": {"browser_render"},
}


# FIX 1 — expanded known CEO LinkedIn URLs.
_KNOWN_CEOS: dict[str, str] = {
    # Verified originals
    "wix": "https://www.linkedin.com/in/avishai-abrahami-2730434/",
    "shopify": "https://www.linkedin.com/in/tobiasluetke/",
    "salesforce": "https://www.linkedin.com/in/marcbenioff/",
    "microsoft": "https://www.linkedin.com/in/satyanadella/",
    "google": "https://www.linkedin.com/in/sundarpichai/",
    "amazon": "https://www.linkedin.com/in/andy-jassy-8b1615/",
    "meta": "https://www.linkedin.com/in/markzuckerberg/",
    "apple": "https://www.linkedin.com/in/timcook/",
    "netflix": "https://www.linkedin.com/in/reedhastings/",
    "airbnb": "https://www.linkedin.com/in/brianchesky/",
    "hubspot": "https://www.linkedin.com/in/yamini-rangan/",
    "zendesk": "https://www.linkedin.com/in/mikklane/",
    "atlassian": "https://www.linkedin.com/in/scottfarquhar/",
    "figma": "https://www.linkedin.com/in/dylanfield/",
    "notion": "https://www.linkedin.com/in/ivanzhao/",
    "stripe": "https://www.linkedin.com/in/patrickcollison/",
    "twilio": "https://www.linkedin.com/in/jeffielmayer/",
    # New — high-confidence additions
    "tsmc": "https://www.linkedin.com/in/cc-wei-90b8b41b1/",          # CC Wei, TSMC CEO
    "uber": "https://www.linkedin.com/in/dkhosrowshahi/",              # Dara Khosrowshahi
    "lyft": "https://www.linkedin.com/in/davidrisher/",                # David Risher
    "anthropic": "https://www.linkedin.com/in/dario-amodei-3934934/",  # Dario Amodei
    "openai": "https://www.linkedin.com/in/samaltman/",                # Sam Altman
    "nvidia": "https://www.linkedin.com/in/jenhsunhuang/",             # Jensen Huang
    "asml": "https://www.linkedin.com/in/christophefouquet/",          # Christophe Fouquet
    "okta": "https://www.linkedin.com/in/toddmckinnon/",               # Todd McKinnon, Okta CEO
    "boeing": "https://www.linkedin.com/in/kelly-ortberg/",            # Kelly Ortberg, Boeing CEO (Aug 2024)
    # TODO: verify before using — excluded from active dict for now
    # "samsung": "https://www.linkedin.com/in/jaeyong-lee-31a83b1a4/"  # Lee Jae-yong
    # "snowflake": "https://www.linkedin.com/in/sridhar-ramaswamy-9b21/"  # Sridhar Ramaswamy
}


# FIX 2 — hard-coded IR / security pages for companies with non-standard URL conventions.
_KNOWN_IR_PAGES: dict[str, str] = {
    "tsmc": "https://investor.tsmc.com/english",
    "asml": "https://www.asml.com/en/investors/",
    "samsung": "https://ir.samsung.com/english/",
    "intel": "https://www.intc.com/investor-relations",
    "nvidia": "https://investor.nvidia.com/",
    "stripe": "https://stripe.com/newsroom",  # private co; newsroom has IPO/layoff/funding news
    "boeing": "https://investors.boeing.com",
}

_KNOWN_TRUST_PAGES: dict[str, str] = {
    "uber": "https://transparency.uber.com",          # public transparency report, JS-rendered
    "lyft": "https://www.lyft.com/safety",
    "airbnb": "https://www.airbnb.com/trust",
    "meta": "https://about.fb.com/news/tag/security/",
    "okta": "https://trust.okta.com",                 # Okta's live trust & security status page
}


def _target_domain(target: str) -> str:
    """Best-effort domain extraction — 'Wix.com' → 'wix.com', 'Shopify' → 'shopify.com'."""
    raw = target.lower().strip().replace("https://", "").replace("http://", "").replace("www.", "")
    domain = raw.split("/")[0]
    if "." not in domain:
        domain = f"{domain}.com"
    return domain


def _domain_slug(domain: str) -> str:
    """Normalize domain to a plain slug for dict lookups.

    'tsmc.com' → 'tsmc', 'uber.com' → 'uber', 'openai.ai' → 'openai'
    """
    slug = domain.lower()
    for ext in (".com", ".io", ".co", ".net", ".org", ".ai", ".tech", ".app"):
        slug = slug.replace(ext, "")
    return slug.replace(".", "-").strip("-")


def _linkedin_url_for(domain: str) -> str:
    """Return a known-working LinkedIn CEO URL, or a slug-based fallback."""
    slug = _domain_slug(domain)
    return _KNOWN_CEOS.get(slug, f"https://www.linkedin.com/in/{slug}-ceo/")


def _browser_url_for_analysis(domain: str, analysis_type: str) -> str:
    """Return the most relevant dynamic page for the analysis type."""
    slug = _domain_slug(domain)
    base = f"https://www.{domain}"
    if analysis_type == "account_pulse":
        return f"{base}/pricing"
    elif analysis_type == "supplier_watch":
        return _KNOWN_IR_PAGES.get(slug, f"{base}/investors")
    else:  # threat_surface
        return _KNOWN_TRUST_PAGES.get(slug, f"{base}/security")


def _ensure_all_products(
    plan: list[ResearchStep], analysis_type: str, target: str
) -> list[ResearchStep]:
    """Append one step per missing Bright Data product — ensures full coverage."""
    used_tools = {s["tool"] for s in plan}
    missing = [
        product
        for product, tools in _REQUIRED_PRODUCTS.items()
        if not (tools & used_tools)
    ]
    if not missing:
        return plan

    domain = _target_domain(target)
    base_url = f"https://www.{domain}"
    step_num = len(plan) + 1

    default_steps: dict[str, ResearchStep] = {
        "serp_api": {
            "step": step_num,
            "goal": f"Search for recent {target} news and market developments",
            "tool": "serp_news",
            "query_or_url": f"{target} news 2025",
            "result": None,
            "ok": None,
        },
        "mcp_server": {
            "step": step_num,
            "goal": f"MCP structured search: {target} company technology overview",
            "tool": "mcp_search",
            "query_or_url": f"{target} company products technology stack 2025",
            "result": None,
            "ok": None,
        },
        "web_unlocker": {
            "step": step_num,
            "goal": f"Fetch {target} press/news page bypassing bot protection",
            "tool": "unlocker_fetch",
            "query_or_url": (
                f"{base_url}/press"
                if analysis_type == "account_pulse"
                else f"{base_url}/investors"
                if analysis_type == "supplier_watch"
                else f"{base_url}/newsroom"  # company newsroom for security announcements
            ),
            "result": None,
            "ok": None,
        },
        "web_scraper_api": {
            "step": step_num,
            "goal": f"Get LinkedIn profile of {target} key executive for leadership intel",
            "tool": "scraper_linkedin",
            "query_or_url": _linkedin_url_for(domain),
            "result": None,
            "ok": None,
        },
        "scraping_browser": {
            "step": step_num,
            "goal": f"Render {target} dynamic page for analysis-relevant JS-rendered data",
            "tool": "browser_render",
            "query_or_url": _browser_url_for_analysis(domain, analysis_type),
            "result": None,
            "ok": None,
        },
    }

    additions: list[ResearchStep] = []
    for product in missing:
        step = {**default_steps[product], "step": step_num}
        additions.append(step)  # type: ignore[arg-type]
        step_num += 1

    log.info("Planner appended %d default steps for missing products: %s", len(additions), missing)
    return plan + additions


def _human(analysis_type: str, target: str, context: str | None) -> str:
    ctx = f"\nContext: {context}" if context else ""
    return f"Analysis type: {analysis_type}\nTarget: {target}{ctx}\n\nCreate the research plan."


async def run_planner(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    analysis_type = state["analysis_type"]
    target = state["target"]
    context = state.get("context")

    await ev.emit(analysis_id, "planner", "started", f"Analyzing {analysis_type} on: {target}")
    await ev.emit(analysis_id, "planner", "thinking", "Building research plan…")

    response_content = await get_llm_response(
        system_msg=_SYSTEM,
        messages=[HumanMessage(content=_human(analysis_type, target, context))],
        max_tokens=2048,
    )

    try:
        raw_plan = extract_json(response_content)
        plan: list[ResearchStep] = raw_plan if isinstance(raw_plan, list) else []
    except Exception as exc:
        log.warning(f"Planner failed to extract JSON from LLM output ({exc}). Generating default plan.")
        plan = []

    # Post-processing guarantee: every plan must cover all 5 Bright Data products.
    plan = _ensure_all_products(plan, analysis_type, target)

    tools_used = {s["tool"] for s in plan}
    products_covered = {
        p for p, tools in _REQUIRED_PRODUCTS.items() if tools & tools_used
    }

    await ev.emit(
        analysis_id, "planner", "completed",
        f"Plan ready: {len(plan)} steps, {len(products_covered)}/5 capabilities",
        payload={"plan": plan},
    )

    event: AgentEvent = {
        "agent": "planner",
        "event_type": "completed",
        "message": f"Plan: {len(plan)} steps, {len(products_covered)}/5 products",
        "provider_product": None,
        "payload": {"plan": plan},
    }
    return {"research_plan": plan, "events": [event]}
