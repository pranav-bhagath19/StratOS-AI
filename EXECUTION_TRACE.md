# StratOS-AI — Exact Execution Trace (`EXECUTION_TRACE.md`)

## 1. Trace 1: The Live Judge Pitch Failure (Reconstructed from DB Telemetry & Task-280)

**Scenario:** User triggers `account_pulse` on `anthropic.com` from the frontend dashboard during technical pitch.

```text
22:46:50.100  [API] POST /analyses/ received: target="anthropic.com", analysis_type="account_pulse"
22:46:50.105  [DB]  Inserted analysis ID: "7486a67d-1da1-4e23-ac73-226242596168", status="queued"
22:46:50.110  [SSE] Frontend connects to /analyses/7486a67d.../stream
22:46:50.112  [ORCHESTRATOR] _run_analysis launched via asyncio.create_task
22:46:50.115  [DB]  Status updated to "running"
22:46:50.118  [ORCHESTRATOR] LangGraph analysis_graph.ainvoke(initial_state)

22:46:50.120  [PLANNER] START — run_planner invoked
22:46:50.122  [SSE] Event emitted: agent="planner", event_type="started", message="Analyzing account_pulse on: anthropic.com"
22:46:50.125  [SSE] Event emitted: agent="planner", event_type="thinking", message="Building research plan…"
22:46:50.612  [LLM] get_llm_response: Attempting model 1: "google/gemma-4-31b-it:free"
22:46:53.576  [LLM] HTTP POST https://openrouter.ai/api/v1/chat/completions -> HTTP 429 Too Many Requests
22:46:53.577  [LLM] Internal retry after 0.40s
22:46:54.388  [LLM] HTTP POST https://openrouter.ai/api/v1/chat/completions -> HTTP 429 Too Many Requests
22:46:54.390  [LLM] Rate limit detected (429). Falling back to model 2.

22:46:54.691  [LLM] get_llm_response: Attempting model 2: "poolside/laguna-s-2.1:free"
22:46:55.235  [LLM] HTTP POST https://openrouter.ai/api/v1/chat/completions -> HTTP 429 Too Many Requests
22:46:55.297  [LLM] Internal retry after 0.41s
22:46:56.061  [LLM] HTTP POST https://openrouter.ai/api/v1/chat/completions -> HTTP 429 Too Many Requests
22:46:56.170  [LLM] Rate limit detected (429). Falling back to model 3.

22:46:56.484  [LLM] get_llm_response: Attempting model 3: "nvidia/nemotron-3-super-120b-a12b:free"
22:46:56.698  [LLM] HTTP POST https://openrouter.ai/api/v1/chat/completions -> HTTP 200 OK (status in body = 503)
22:46:56.813  [LLM] Upstream error: {'message': 'Upstream error from Nvidia: Service temporarily overloaded', 'code': 503, 'metadata': {'error_type': 'provider_overloaded'}}
22:46:56.814  [LLM] is_rate_limit evaluated to FALSE.
22:46:56.815  [LLM] CRITICAL ERROR: "Fail-fast error encountered with model nvidia/nemotron-3-super-120b-a12b:free"
22:46:56.816  [LLM] Exception raised: ValueError({'message': 'Upstream error from Nvidia: Service temporarily overloaded', ...})
22:46:56.817  [PLANNER] Unhandled exception from get_llm_response!
22:46:56.818  [PLANNER] Execution crashed at line 296 of intelligence/agents/planner/agent.py

22:46:56.820  [ORCHESTRATOR] analysis_graph.ainvoke raised ValueError
22:46:56.822  [ORCHESTRATOR] Exception caught in _run_analysis except block
22:46:56.823  [DB]  aupdate_analysis_status("7486a67d...", "failed")
22:46:56.825  [SSE] Event emitted: agent="coordinator", event_type="failed", message="Analysis failed: {'message': 'Upstream error from Nvidia: Service temporarily overloaded', ...}"
22:46:56.828  [DB]  ainsert_intelligence_event(agent="commander", event_type="failed", ...)
22:46:56.830  [SSE] emit_done("7486a67d...") sends {"event": "done", "data": "{\"message\": \"analysis complete\"}"}

22:46:56.900  [FRONTEND] SSE listener receives "done" event
22:46:56.905  [FRONTEND] sets phase = "complete" (UNCONDITIONALLY)
22:46:56.910  [FRONTEND] GET /analyses/7486a67d... -> {"analysis": {"status": "failed"}, "brief": null}
22:46:56.915  [FRONTEND] data.brief is null -> setBrief(null)
22:46:56.920  [FRONTEND] UI renders status "COMPLETE", log displays "ANALYSIS COMPLETE", brief panel renders NOTHING (blank white/black screen)
22:46:56.925  [JUDGE EXPERIENCE] The judge sees the pipeline stop after 6.5 seconds. No brief is displayed. The system appears completely non-functional.
```

---

## 2. Trace 2: The Secondary Cascade Failure (Researcher Hang & Timeout)

If the Planner somehow succeeds (as in `task-215` when `poolside/laguna-s-2.1:free` succeeded on retry), the system encounters the **Researcher Concurrency & Playwright Deadlock**:

```text
22:43:49.015  [PLANNER] Plan completed: 5 steps generated
22:43:49.020  [RESEARCHER] START — Firing 5 steps in parallel via asyncio.gather:
              - Step 1: serp_news ("Anthropic leadership Claude 3 product launch 2024")
              - Step 2: unlocker_fetch ("https://www.anthropic.com/press")
              - Step 3: mcp_search ("Anthropic funding Series D valuation investors 2024")
              - Step 4: mcp_search ("Anthropic AI chatbot Claude enterprise customers")
              - Step 5: browser_render ("https://www.anthropic.com/pricing")
              - Step 6: scraper_linkedin ("https://www.linkedin.com/in/dario-amodei-3934934/")

22:43:49.203  [DB/CACHE] Step 1 and Step 3 concurrently call get_cached()
22:43:49.203  [DB/CACHE] Race condition in get_firebase_app():
              "Firebase: Failed to initialize Admin SDK: The default Firebase app already exists."
22:43:49.206  [DB/CACHE] Step 3 cache lookup crashes with ValueError. Falls back to in-memory cache.

22:43:50.883  [TOOL: BROWSER] Step 5 launches Playwright headless Chromium for pricing page
22:43:51.196  [TOOL: BROWSER] Step 6 launches SECOND concurrent Playwright headless Chromium for LinkedIn URL
22:43:51.228  [TOOL: FETCH] Step 2 (anthropic.com/press) returns HTTP 404
22:43:51.710  [TOOL: FETCH] Step 2 fallback: requests returns HTTP 404
22:43:51.711  [TOOL: BROWSER] Step 2 launches THIRD concurrent Playwright headless Chromium for the 404 page

22:43:52.000  [OS / PLAYWRIGHT] 3 concurrent sync_playwright() instances run inside asyncio.to_thread worker threads
22:43:52.100  [OS / PLAYWRIGHT] Node.js driver child process on Windows blocks on stdin/stdout IPC pipes
22:43:52.102  [TOOL: SEARCH] 3 concurrent requests hit DuckDuckGo simultaneously
22:43:52.105  [TOOL: SEARCH] DuckDuckGo returns HTTP 202 Ratelimit
22:43:54.000  [TOOL: SEARCH] Tenacity retries after 2s backoff, hits rate limits on search steps
22:44:26.000  [RESEARCHER] Step 5 (browser_render) times out after 35s. Spawns retry thread for another 21s.
22:45:30.000  [RESEARCHER] Step 6 (scraper_linkedin) has a 160.0s TIMEOUT BUDGET!
22:45:30.000  [RESEARCHER] Worker threads are frozen inside _fetch_blocking; asyncio.wait_for cannot cancel OS threads.
22:46:31.000  [RESEARCHER] Researcher remains hung for >160 seconds.
22:46:31.000  [JUDGE EXPERIENCE] Live demo exceeds pitch window (3+ minutes). Screen shows loader spinning indefinitely with zero visual progress.
```

---

## 3. First Meaningful Failure Pinpoint

* **File:** `intelligence/agents/base/llm.py`
* **Function:** `get_llm_response`
* **Line Number:** Lines 78–80
* **Condition:** `if is_rate_limit: ... else: log.error(...); raise`
* **Exact Exception:**
  `ValueError: {'message': 'Upstream error from Nvidia: Service temporarily overloaded', 'code': 503, 'metadata': {'error_type': 'provider_overloaded'}}`
* **Immediate Consequence:** `run_planner` in `intelligence/agents/planner/agent.py` crashes on line 296 without executing any planning logic.
* **Secondary Consequence:** `intelligence/workflows/executive_brief/graph.py` halts execution.
* **Downstream Consequence:** `_run_analysis` catches exception, marks status "failed", but emits `done` event.
* **Frontend Consequence:** Dashboard displays "COMPLETE" with a completely blank brief report.
