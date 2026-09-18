# StratOS-AI — LLM Calls Forensic Audit (`AUDIT_LLM_CALLS.md`)

## 1. Inventory of All LLM Calls in the System

All LLM calls funnel through a single shared invocation helper:
`intelligence/agents/base/llm.py:get_llm_response`.

| Agent | File | Function | Provider | Models Attempted (in order) | Max Tokens | Timeout | Catch / Fallback in Agent? |
|---|---|---|---|---|---|---|---|
| **Planner** | `intelligence/agents/planner/agent.py` | `run_planner` | OpenRouter | `settings.openrouter_free_models` | 2048 | 45s | **NO** (Crashes on LLM exception) |
| **Researcher** | `intelligence/agents/researcher/agent.py` | `run_researcher` | N/A | *No LLM calls* (uses search/scraping tools) | N/A | N/A | N/A |
| **Scout** | `intelligence/agents/scout/agent.py` | `run_scout` | OpenRouter | `settings.openrouter_free_models` | 1024 | 45s | **NO** (Crashes on LLM exception) |
| **Verifier** | `intelligence/agents/verifier/agent.py` | `run_verifier` | OpenRouter | `settings.openrouter_free_models` | 2048 | 45s | **NO** (Crashes on LLM exception) |
| **Coordinator** | `intelligence/agents/coordinator/agent.py` | `run_coordinator` | OpenRouter | `settings.openrouter_free_models` | 2048 | 45s | **NO** (Crashes on LLM exception) |

---

## 2. Forensic Specification of Each LLM Call

### 2.1. Planner LLM Call
* **Agent:** Planner
* **File:** `intelligence/agents/planner/agent.py`
* **Function:** `run_planner(state: AnalysisState)` (lines 296–300)
* **Provider:** OpenRouter (`https://openrouter.ai/api/v1`) via `langchain_openai.ChatOpenAI`
* **Model Configuration:** Reads `settings.openrouter_free_models`:
  1. `google/gemma-4-31b-it:free`
  2. `poolside/laguna-s-2.1:free`
  3. `nvidia/nemotron-3-super-120b-a12b:free`
  4. `nvidia/nemotron-nano-9b-v2:free`
* **Temperature:** Default `ChatOpenAI` (0.7)
* **Max Tokens:** 2048
* **System Prompt:** `_SYSTEM` (lines 16–99): Defines Bright Data tools, analysis types, 5-step rule, query length limits, and JSON-only output format.
* **User Prompt:** `_human(analysis_type, target, context)`: `"Analysis type: {analysis_type}\nTarget: {target}\nContext: {context}\n\nCreate the research plan."`
* **Structured Output Enforced by API:** **NO**. Raw text completion parsed by regex/bracket evaluator in `extract_json`.
* **Schema Expected:** `list[ResearchStep]` (`step`, `goal`, `tool`, `query_or_url`, `result`, `ok`)
* **Timeout:** 45 seconds per model attempt.
* **Retry Behavior:** `ChatOpenAI(max_retries=1)` internally; 429 fallback loop in `llm.py`.
* **Fallback on Non-429 Error:** **NONE**. Raises immediately, crashing `run_planner`.
* **Streaming:** **NO**. Synchronous response awaited (`await llm.ainvoke`).

---

### 2.2. Scout LLM Call
* **Agent:** Scout
* **File:** `intelligence/agents/scout/agent.py`
* **Function:** `run_scout(state: AnalysisState)` (lines 38–42)
* **Provider:** OpenRouter
* **Models:** `settings.openrouter_free_models`
* **Temperature:** Default
* **Max Tokens:** 1024
* **System Prompt:** `_SYSTEM` (lines 16–27): Review research findings, raise 3–5 pointed challenges (data gaps, recency, source quality, contradictions, bias). Respond with JSON array of strings.
* **User Prompt:** `f"Target: {target}\n\nFindings:\n{findings[:6000]}"`
  - **State Loss / Truncation:** Research findings are truncated to 6000 characters. Anything beyond is invisible to Scout.
  - `provider_calls` telemetry is completely omitted.
* **Structured Output Enforced by API:** **NO**.
* **Schema Expected:** `list[str]`
* **Timeout:** 45 seconds per attempt.
* **Retry Behavior:** `max_retries=1`.
* **Fallback on Non-429 Error:** **NONE**. Crashes `run_scout`.
* **Streaming:** **NO**.

---

### 2.3. Verifier LLM Call
* **Agent:** Verifier
* **File:** `intelligence/agents/verifier/agent.py`
* **Function:** `run_verifier(state: AnalysisState)` (lines 88–92)
* **Provider:** OpenRouter
* **Models:** `settings.openrouter_free_models`
* **Temperature:** Default
* **Max Tokens:** 2048
* **System Prompt:** `_SYSTEM` (lines 16–59): Rules for resolving challenges (CONFIRMED, REFUTED, PARTIAL), confidence calibration instructions, penalty rules for timeouts. Respond with JSON object.
* **User Prompt:** Constructed in lines 79–86:
  - Formatted list of `provider_calls` (product, tool, status, latency)
  - Calculated penalty
  - `Research Findings:\n{findings[:4500]}` (**Truncated to 4500 characters**)
  - `Scout Challenges:\n{json.dumps(challenges, indent=2)}`
* **Structured Output Enforced by API:** **NO**.
* **Schema Expected:** `{"verified_findings": str, "confidence_score": int, "resolutions": list}`
* **Timeout:** 45 seconds per attempt.
* **Retry Behavior:** `max_retries=1`.
* **Fallback on Non-429 Error:** **NONE**. Crashes `run_verifier`.
* **Streaming:** **NO**.

---

### 2.4. Coordinator LLM Call
* **Agent:** Coordinator
* **File:** `intelligence/agents/coordinator/agent.py`
* **Function:** `run_coordinator(state: AnalysisState)` (lines 88–92)
* **Provider:** OpenRouter
* **Models:** `settings.openrouter_free_models`
* **Temperature:** Default
* **Max Tokens:** 2048
* **System Prompt:** `_SYSTEM` (lines 16–62): Decision framework (ESCALATE, ATTACK, DEFEND, WAIT, MONITOR), calibration scale, JSON structure with headline, situation, key_findings, action_pack.
* **User Prompt:** Constructed in lines 80–86:
  - Analysis type, target, confidence score, provider coverage summary
  - `Verified Intelligence:\n{verified_findings}`
  - `Open Challenges:\n{json.dumps(challenges, indent=2)}`
* **Structured Output Enforced by API:** **NO**.
* **Schema Expected:** Object with `market_move_score`, `recommended_move`, `headline`, `situation`, `key_findings`, `action_pack`, `coordinator_rationale`.
* **Timeout:** 45 seconds per attempt.
* **Retry Behavior:** `max_retries=1`.
* **Fallback on Non-429 Error:** **NONE**. Crashes `run_coordinator`.
* **Streaming:** **NO**.

---

## 3. Major Forensic Defects in LLM Infrastructure

### Defect 1: Hardcoded Model Bypassing User Configuration
In `backend/config/config.py`, line 15:
`openrouter_model: str = "anthropic/claude-3.5-sonnet"`
And `.env.example` instructs users to configure `OPENROUTER_MODEL=anthropic/claude-3.5-sonnet`.
However, `intelligence/agents/base/llm.py` lines 20–26 completely ignores `settings.openrouter_model` and executes:
`models = settings.openrouter_free_models`
Even when a paid key with access to Claude 3.5 Sonnet is provided, the code routes requests to the free-tier model pool!

### Defect 2: Faulty "Fail-Fast" Error Handling in `llm.py`
In `intelligence/agents/base/llm.py` lines 56–80:
```python
if is_rate_limit:
    log.warning(f"Model {model} hit rate limit (429). Falling back to next model. Error: {e}")
    last_exception = e
    continue
else:
    log.error(f"Fail-fast error encountered with model {model}: {e}")
    raise
```
**Empirically reproduced during this audit:** When `nvidia/nemotron-3-super-120b-a12b:free` was called, Nvidia returned an upstream HTTP 503 (`'code': 503, 'metadata': {'error_type': 'provider_overloaded'}`).
Because `503` is not `429`, `is_rate_limit` evaluated to `False`. The loop immediately executed `raise`, completely abandoning the remaining model (`nvidia/nemotron-nano-9b-v2:free`) and crashing the entire pipeline.

### Defect 3: Missing Try/Except in Calling Agents
Not a single agent (`run_planner`, `run_scout`, `run_verifier`, `run_coordinator`) wraps `get_llm_response` in a `try...except` block.
While they have fallbacks for JSON parsing errors (`extract_json`), any network blip, HTTP 5xx, or provider outage instantly bubbles up as an unhandled exception to `_run_analysis`.

### Defect 4: Evidence Truncation / State Blindness
- Scout only sees `findings[:6000]`.
- Verifier only sees `findings[:4500]`.
When Researcher gathers multiple detailed web pages (e.g. 20,000+ characters of content), more than 75% of the collected intelligence is silently discarded before reaching verification.
