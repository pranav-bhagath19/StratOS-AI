# Sample Battle Briefs — Deterministic Demo Fixtures

The files in this folder are **deterministic demo fixtures**. They are *not* live
runs. They exist to show the **structure, reasoning, and output format** of a War
Room AI Executive Strategic Brief without requiring a reviewer to configure Bright
Data and Anthropic credentials first.

## How to read a fixture

Every brief in this folder carries a provenance header with four distinct dates
and a mode label. Read them literally:

| Field | Meaning |
|-------|---------|
| **Mode** | `DETERMINISTIC DEMO FIXTURE` — hand-curated example output, not a live analysis run. |
| **Analysis executed** | The date the illustrative analysis run was authored. |
| **Facts as-of** | The date the underlying facts were last true to the author's knowledge. Figures reflect *this* date, not today. |
| **Fixture last verified** | The last date a maintainer reviewed this file for provenance and obvious staleness. |
| **Provenance** | Where the numbers come from and how confident we are in them. |

Because these are fixtures, **any figure in them should be treated as illustrative
and possibly stale.** A real, credential-backed analysis run refreshes every signal
from the live web at execution time and stamps its own timestamps.

## Evidence vs. inference vs. recommendation

Each brief separates three things that are easy to blur together:

- **Evidence** — a specific, attributable claim a source made (or that was reported).
  In a live run this carries the acquisition method (Search / Fetch / Browser /
  Scraper / API), the source URL, and the fetch timestamp.
- **Inference** — a conclusion the agent pipeline drew by combining evidence. This is
  reasoning, not a fact, and is labeled as such.
- **Recommendation** — the Coordinator's decisive call (ATTACK / DEFEND / ESCALATE /
  WAIT / MONITOR) with the rationale for choosing it over the alternatives.

**Confidence** is a 0–100 score describing the *quality* of the evidence found — not
the number of tools that fired. Empty or timed-out sources limit scope; they do not
by themselves lower confidence in what was found.

## Live mode vs. demo fixture mode

| | Live run (credentialed) | Deterministic demo fixture (this folder) |
|---|---|---|
| Data source | Live public web at execution time | Hand-curated, captured on the `Facts as-of` date |
| Timestamps | Real per-call latency + wall time | Illustrative — shown to convey format, not measured guarantees |
| Freshness | Current as of the run | As stale as the `Facts as-of` date |
| Reproducibility | Re-run to refresh | Static file; edit to update |
| Where to get one | Run a analysis at the deployed app or locally (see the root README) | Read the files here |

If you want a current brief, run a live analysis — see **Local setup** and **Live mode
vs. deterministic demo mode** in the [root README](../../README.md).

## Files

- [`anthropic-account-pulse.md`](anthropic-account-pulse.md) — Competitive Intelligence / Account Pulse (the initial market wedge)
- [`boeing-supplier-watch.md`](boeing-supplier-watch.md) — Supplier Watch (expansion module)
- [`change-healthcare-threat-surface.md`](change-healthcare-threat-surface.md) — Threat Surface (expansion module)
