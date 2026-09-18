# StratOS-AI — Latency Baseline & Optimization Report

## Executive Summary
This report analyzes the latency profile of the 5-agent StratOS-AI pipeline, details the bottlenecks identified during adversarial testing, and documents optimizations applied to minimize wall-clock latency while preserving strict accuracy.

---

## 1. Pipeline Execution Stages & Latency Profile

| Agent / Stage | Execution Model | Typical Budget / Ceiling | Optimization Applied |
| :--- | :--- | :--- | :--- |
| **Planner** | Single LLM invocation | 1.5s – 3.0s | Eliminated 100–250ms initial attempt jitter sleep. Structured system prompt with strict schema guidance. |
| **Researcher** | Sequential / Concurrent provider execution across 5 Bright Data tools | 4.0s – 12.0s | Per-product timeouts strictly capped (`serp_api`: 10s, `mcp_server`: 15s, `web_unlocker`: 15s, `web_scraper_api`: 20s, `scraping_browser`: 15s). Browser execution isolated in short-lived worker subprocesses. |
| **Scout** | Structured evidence review + LLM challenge generation | 1.0s – 2.5s | Structured evidence compression (`format_structured_evidence`) caps payload at 8,000 chars across all 5 steps instead of slicing arbitrary raw text. Eliminated initial attempt sleep. |
| **Verifier** | Evidence corroboration + LLM confidence calibration | 1.5s – 3.0s | Structured evidence input. Direct resolution schema. Eliminated initial attempt sleep. |
| **Coordinator** | Strategic synthesis + Battle Brief generation | 2.0s – 4.0s | Verified intelligence capped at 6,000 chars. Immediate JSON extraction. Eliminated initial attempt sleep. |
| **Total Pipeline** | End-to-end multi-agent execution | **10.0s – 24.5s** | Total end-to-end duration without artificial delays. Under network errors/chaos, fast-fails in < 1.0s. |

---

## 2. Latency Optimizations Implemented

1. **Elimination of Artificial Pre-Call Sleep in LLM Layer (`llm.py`)**:
   - *Previous*: `jitter = random.uniform(0.05, 0.15); await asyncio.sleep(0.1 + jitter)` was executed before **every** LLM attempt, including attempt 1 on primary models.
   - *Impact*: For a 4-agent LLM chain, this wasted up to 1,000ms of pure idle time.
   - *Fix*: Pacing delay now strictly triggers only on retries (`if attempt > 0`), saving ~1 second per clean analysis.

2. **Structured Evidence Compression (`format_structured_evidence`)**:
   - *Previous*: Naive `raw_findings[:4500]` truncated findings blindly, often starving Verifier and Coordinator of evidence from later research steps (steps 4 and 5).
   - *Fix*: Structured compression extracts summaries evenly across all 5 provider steps up to a balanced 8,000-character budget, reducing LLM context processing latency and token consumption while improving analytical fidelity.

3. **Subprocess Worker Process Pool for Browser Isolation**:
   - *Previous*: Inline Playwright launching risking thread deadlocks and slow teardown on Windows.
   - *Fix*: Worker subprocesses execute with hard 15.0s timeouts, clean process group termination on exit, and zero orphan Chromium process leakage.

4. **Fast-Fail on Non-Transient / Exhaustion Errors**:
   - Immediate rotation through fallback models on non-transient errors (0 retries on fallback models) prevents prolonged hanging during credit limits or invalid configurations.
