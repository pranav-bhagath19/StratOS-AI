# StratOS-AI — Architectural Audit (`AUDIT_ARCHITECTURE.md`)

## 1. High-Level Real Pipeline Flow

```text
USER / BROWSER (Next.js Dashboard)
 ↓ HTTP POST /analyses/
[API: backend/routes/analyses.py:create_analysis]
 ↓ asyncio.create_task(_run_analysis)
[ORCHESTRATOR: intelligence/workflows/executive_brief/graph.py:analysis_graph]
 ↓ LangGraph START -> planner
[PLANNER: intelligence/agents/planner/agent.py:run_planner]
 ↓ state["research_plan"]
[RESEARCHER: intelligence/agents/researcher/agent.py:run_researcher]
 ↓ state["raw_findings"], state["provider_calls"]
[SCOUT: intelligence/agents/scout/agent.py:run_scout]
 ↓ state["challenges"]
[VERIFIER: intelligence/agents/verifier/agent.py:run_verifier]
 ↓ state["verified_findings"], state["confidence_score"]
[COORDINATOR: intelligence/agents/coordinator/agent.py:run_coordinator]
 ↓ state["market_move_score"], state["recommended_move"], state["action_pack"]
[FINAL OUTPUT: database/client.py:ainsert_brief & SSE Stream /analyses/{id}/stream]
```

---

## 2. Component-by-Component Transition Map

### Transition 1: User / Frontend → API Route
* **Source:** `frontend/app/dashboard/page.tsx` (`deployAnalysis` function)
* **Destination File:** `backend/routes/analyses.py`
* **Destination Function:** `create_analysis(body: AnalysisCreate)`
* **HTTP Method & URL:** `POST /analyses/` (default `http://localhost:8000/analyses/`)
* **Input Schema:** `AnalysisCreate` (`target: str`, `analysis_type: AnalysisTypeEnum`, `context: str | None`)
* **Output Schema:** `{"analysis_id": str, "status": "queued"}` (HTTP 201)
* **State Initialized:** `initial_state: AnalysisState` in `_run_analysis`
* **Serialization Format:** JSON over HTTP
* **Error Handling:** FastAPI `HTTPException(422)` on invalid body. Client catches in try/catch and emits Sonner error toast.
* **Retry Behavior:** None.
* **Timeout:** Standard browser fetch timeout.
* **Logging:** `log.info(f"Database: Inserting analysis ...")`
* **External Dependency:** Database client (`db.ainsert_analysis`).

---

### Transition 2: API Route → Orchestrator (`_run_analysis` → LangGraph)
* **Source File:** `backend/routes/analyses.py`
* **Source Function:** `_run_analysis(analysis_id, analysis_type, target, context)`
* **Destination File:** `intelligence/workflows/executive_brief/graph.py`
* **Destination Object:** `analysis_graph = build_graph()`
* **Invocation:** `final_state = await analysis_graph.ainvoke(initial_state)`
* **Input Schema:** `AnalysisState` dict (all fields empty/default except `analysis_id`, `analysis_type`, `target`, `context`)
* **Output Schema:** `final_state: AnalysisState`
* **Error Handling:** Wrapped in `try...except Exception as exc` in `_run_analysis`. On exception:
  1. Calls `db.aupdate_analysis_status(analysis_id, "failed")`
  2. Calls `ev.emit(analysis_id, "coordinator", "failed", f"Analysis failed: {exc}")`
  3. Calls `db.ainsert_intelligence_event(..., agent="coordinator", event_type="failed", ...)`
  4. Finally block calls `ev.emit_done(analysis_id)`
* **Logging:** `log.exception(f"Analysis {analysis_id} failed")`
* **External Dependency:** LangGraph runtime (`langgraph.graph.StateGraph`).

---

### Transition 3: START → Planner Agent
* **Source Node:** `START`
* **Destination File:** `intelligence/agents/planner/agent.py`
* **Destination Function:** `run_planner(state: AnalysisState) -> dict`
* **Input State Keys Read:** `state["analysis_id"]`, `state["analysis_type"]`, `state["target"]`, `state.get("context")`
* **Output State Modification:** Returns `{"research_plan": plan, "events": [event]}`
* **Serialization Format:** In-memory Python `dict` conforming to `TypedDict`
* **Internal LLM Invocation:** `get_llm_response(system_msg=_SYSTEM, messages=[...], max_tokens=2048)`
* **Output Parsing:** `extract_json(response_content)` -> `plan: list[ResearchStep]`
* **Fallbacks:**
  - If `extract_json` fails: defaults `plan = []`
  - Post-processing: `_ensure_all_products(plan, analysis_type, target)` guarantees 5 Bright Data product steps are present
  - **CRITICAL DEFECT:** If `get_llm_response` throws an exception, there is NO try/except; the function crashes.
* **Timeout:** LLM timeout 45s (`ChatOpenAI(request_timeout=45)`).
* **Logging:** `log.warning` on JSON extraction failure; `log.info` on appended steps.
* **External Dependency:** OpenRouter API (`openrouter.ai/api/v1/chat/completions`).

---

### Transition 4: Planner → Researcher Agent
* **Source Node:** `"planner"`
* **Destination File:** `intelligence/agents/researcher/agent.py`
* **Destination Function:** `run_researcher(state: AnalysisState) -> dict`
* **Input State Keys Read:** `state["analysis_id"]`, `state["research_plan"]`
* **Output State Modification:** Returns `{"raw_findings": str, "provider_calls": list[ProviderCall], "events": list[AgentEvent]}`
* **Execution Model:** `asyncio.gather(*[_run_step(step, analysis_id) for step in plan])` (all steps in parallel)
* **Sub-components & Tools Dispatched:**
  - `serp_search`, `serp_news`, `mcp_search` → `provider_manager.search` (DuckDuckGo / Brave)
  - `mcp_scrape`, `unlocker_fetch` → `provider_manager.fetch_page` (aiohttp / requests)
  - `browser_render`, `scraper_linkedin` → `provider_manager.fetch_page(force_browser=True)` (Playwright)
* **Timeout per Tool:**
  - `serp_api`: 15.0s
  - `mcp_server`: 20.0s
  - `web_unlocker`: 30.0s
  - `web_scraper_api`: 160.0s
  - `scraping_browser`: 35.0s (plus 1 retry at 21.0s = 57.0s total)
* **Error Handling:** Each step wrapped in `_attempt_with_retry` and `_execute` with internal `try...except`. Exceptions converted to `"[Error in {tool}: {exc}]"`.
* **External Dependencies:** DuckDuckGo Web API, Brave Search API (optional), target websites, local Playwright headless Chromium.

---

### Transition 5: Researcher → Scout Agent
* **Source Node:** `"researcher"`
* **Destination File:** `intelligence/agents/scout/agent.py`
* **Destination Function:** `run_scout(state: AnalysisState) -> dict`
* **Input State Keys Read:** `state["analysis_id"]`, `state["target"]`, `state["raw_findings"]`
* **Input State Discarded/Ignored:** `state["provider_calls"]` is completely ignored.
* **Output State Modification:** Returns `{"challenges": list[str], "events": [event]}`
* **Truncation:** `findings[:6000]` (hard slice of raw findings passed to LLM).
* **Internal LLM Invocation:** `get_llm_response(system_msg=_SYSTEM, messages=[...], max_tokens=1024)`
* **Output Parsing:** `extract_json(response_content)` -> `challenges: list[str]`
* **Fallbacks:**
  - If `extract_json` fails: defaults to 2 static fallback challenges.
  - **CRITICAL DEFECT:** If `get_llm_response` throws an exception, there is NO try/except; Scout crashes.
* **Timeout:** 45s.
* **Logging:** `log.warning` on JSON extraction failure.
* **External Dependency:** OpenRouter API.

---

### Transition 6: Scout → Verifier Agent
* **Source Node:** `"scout"`
* **Destination File:** `intelligence/agents/verifier/agent.py`
* **Destination Function:** `run_verifier(state: AnalysisState) -> dict`
* **Input State Keys Read:** `state["analysis_id"]`, `state["target"]`, `state["raw_findings"]`, `state["challenges"]`, `state["provider_calls"]`
* **Output State Modification:** Returns `{"verified_findings": str, "confidence_score": int, "events": [event]}`
* **Truncation:** `findings[:4500]` (hard slice).
* **Internal LLM Invocation:** `get_llm_response(system_msg=_SYSTEM, messages=[...], max_tokens=2048)`
* **Output Parsing:** `extract_json(response_content)` -> `{"verified_findings": str, "confidence_score": int, "resolutions": list}`
* **Fallbacks:**
  - If `extract_json` fails: defaults `verified_findings = findings[:2000]`, `confidence_score = 60`.
  - **CRITICAL DEFECT:** If `get_llm_response` throws an exception, there is NO try/except; Verifier crashes.
* **Timeout:** 45s.
* **Logging:** `log.warning` on JSON extraction failure.
* **External Dependency:** OpenRouter API.

---

### Transition 7: Verifier → Coordinator Agent
* **Source Node:** `"verifier"`
* **Destination File:** `intelligence/agents/coordinator/agent.py`
* **Destination Function:** `run_coordinator(state: AnalysisState) -> dict`
* **Input State Keys Read:** `state["analysis_id"]`, `state["analysis_type"]`, `state["target"]`, `state["verified_findings"]`, `state["confidence_score"]`, `state["challenges"]`, `state["provider_calls"]`
* **Input State Discarded/Ignored:** `state["raw_findings"]` is not read (uses `verified_findings`).
* **Output State Modification:** Returns:
  ```python
  {
      "market_move_score": int,
      "recommended_move": str,
      "executive_summary": str,
      "action_pack": dict,
      "events": [event],
  }
  ```
* **Internal LLM Invocation:** `get_llm_response(system_msg=_SYSTEM, messages=[...], max_tokens=2048)`
* **Output Parsing:** `extract_json(response_content)`
* **Fallbacks:**
  - If `extract_json` fails: defaults to synthetic action pack with `recommended_move = "MONITOR"` and `market_move_score = 50`.
  - **CRITICAL DEFECT:** If `get_llm_response` throws an exception, there is NO try/except; Coordinator crashes.
* **Timeout:** 45s.
* **Logging:** `log.warning` on JSON extraction failure.
* **External Dependency:** OpenRouter API.

---

### Transition 8: Coordinator → END & Persistence / Streaming
* **Source Node:** `"coordinator"` -> `END`
* **Destination File:** `backend/routes/analyses.py` (`_run_analysis` post-invocation lines 55–79)
* **Actions:**
  1. `for evt in final_state.get("events", []): await db.ainsert_intelligence_event(...)`
  2. `await db.ainsert_brief(analysis_id, {...})`
  3. `await db.aupdate_analysis_status(analysis_id, "completed")`
  4. `await ev.emit_done(analysis_id)` (in `finally`)
* **Streaming Delivery:** `GET /analyses/{analysis_id}/stream` yields SSE `EventSourceResponse`.
* **Frontend Reception:** `frontend/app/dashboard/page.tsx` receives `intelligence_event` and `done` SSE events.
* **Frontend Completion Hook:** On `done`, queries `GET /analyses/{id}`, sets `brief = data.brief`, sets `phase = "complete"`.
* **CRITICAL DEFECT:** On backend crash in `_run_analysis`, `finally: await ev.emit_done(analysis_id)` STILL fires. Frontend transitions to `phase = "complete"`, queries `GET /analyses/{id}` which returns `brief = null`. The UI remains blank and shows "COMPLETE", completely masking the failure.
