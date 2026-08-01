# StratOS AI — Technical Guide

Welcome to the StratOS AI technical guide. This document details the application architecture, directory structure, data flows, and configuration environment.

---

## 1. System Architecture

StratOS AI is structured as a modular, containerized multi-agent system executing over a provider-agnostic data acquisition layer, with Cloud Firestore persistence.

```mermaid
flowchart TD
    subgraph UI["Frontend Layer — Next.js 16"]
        Console["Dashboard Console"]
        Share["Share View"]
    end

    subgraph API["Backend API Layer — FastAPI"]
        Uvi["Uvicorn Router"]
        SSE["SSE Event Streamer"]
        Worker["Inngest Workers"]
    end

    UI --> REST["REST API"] & SSE_Stream["SSE Client"]
    REST --> Uvi
    SSE_Stream --> SSE

    subgraph Agents["LangGraph Pipeline"]
        P["Planner"] --> R["Researcher"]
        R --> Sk["Scout"]
        Sk --> V["Verifier"]
        V --> C["Coordinator"]
    end

    Uvi --> Agents

    subgraph IL["Intelligence Layer (integrations/)"]
        SP["Search Provider<br/>DuckDuckGo (duckduckgo.py)"]
        FP["Fetch Providers<br/>Requests, aiohttp"]
        BP["Browser Provider<br/>Playwright"]
        EX["Extraction Providers<br/>BeautifulSoup, Trafilatura, Markdown"]
        APIs["Official APIs<br/>GitHub, Reddit, RSS"]
        Cache["Scraper Cache<br/>24h Firestore cache"]
    end

    R --> IL
    IL --> SP & FP & BP & EX & APIs & Cache

    LLM["OpenRouter (Claude 3.5 Sonnet)"]
    P --> LLM
    Sk --> LLM
    V --> LLM
    C --> LLM

    subgraph DB["Database Layer — Firebase Cloud Firestore"]
        Analyses["analyses"]
        Events["intelligence_events"]
        Briefs["briefs"]
        CacheDB["scraper_cache"]
        Sched["analysis_schedules"]
    end

    API --> DB
    Inngest["Inngest<br/>cron scheduler"] --> API
```

---

## 2. Directory Structure

```
warroom-ai/
├── .env.example            # Environment variables template
├── pyproject.toml          # Python dependencies (FastAPI, LangGraph, firebase-admin, etc.)
├── uv.lock                 # Lockfile for Python dependencies managed by uv
├── package.json            # Node/Frontend dependencies (Next.js 16, framer-motion, Firebase SDK)
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configuration
├── ARCHITECTURE.md         # Design decisions and architectural notes
├── firebase_local.json     # Local file database (auto-created if Firebase credentials are empty)
├── app/                    # Next.js Frontend + Backend API Mount
│   ├── layout.tsx          # Next.js global root layout
│   ├── page.tsx            # Next.js landing page
│   ├── globals.css         # Global styling (Tailwind CSS v4 setup)
│   ├── pricing/            # Next.js billing/pricing page
│   ├── share/              # Next.js public shared brief viewer (/share/[id])
│   ├── dashboard/          # Next.js main web workspace
│   │   └── page.tsx        # Dashboard, EventSource listeners, analysis runner UI
│   └── api/                # Python backend codebase
│       ├── main.py         # FastAPI app, middleware, Inngest mounting
│       └── routes/         # Backend API routes
│           ├── health.py   # Health status endpoint
│           ├── analyses.py # REST endpoints for creating/streaming/reading analyses
│           ├── briefs.py   # Strategic Battle Brief fetching, PDF generation, sharing
│           └── schedules.py# CRUD operations for recurring analyses
├── core/                   # Shared backend utilities
│   ├── config/             # Config loader
│   │   └── config.py       # Pydantic settings loading environment variables
│   ├── database/           # DB Client
│   │   └── client.py       # Database facade routing to Firebase repositories
│   ├── schemas/            # Pydantic Models for requests/responses
│   └── workflows/          # LangGraph Graph Setup
│       ├── executive_brief/
│       │   └── graph.py    # LangGraph StateGraph nodes and edges configuration
│       └── scheduler/
│           └── inngest_client.py # Inngest event router, weekly/cron cron jobs
├── agents/                 # LangGraph Agent nodes
│   ├── base/               # Agent base types
│   │   ├── state.py        # AnalysisState TypedDict configuration
│   │   └── events.py       # Event streaming queue client for SSE
│   ├── planner/            # Agent: Planner Node (Creates research plans)
│   ├── researcher/         # Agent: Researcher Node (Runs provider manager in parallel)
│   ├── scout/              # Agent: Scout Node (Generates adversarial challenges)
│   ├── verifier/           # Agent: Verifier Node (Calculates confidence & resolutions)
│   └── coordinator/        # Agent: Coordinator Node (Synthesizes brief & decides strategic move)
├── integrations/           # Third-party integrations
│   ├── search/             # Search engines (DuckDuckGo)
│   ├── fetch/              # Raw document crawlers (Requests, aiohttp)
│   ├── browser/            # Headless browser engines (Playwright)
│   ├── extract/            # Boilerplate cleaning and formatters (BeautifulSoup, Trafilatura, Markdown)
│   ├── apis/               # Direct platform connections (GitHub, Reddit, RSS)
│   ├── cache/              # Memory/database caching module
│   └── manager.py          # Unified Provider Manager (coordinates failover, routing, caching)
├── firebase/               # Firebase Admin module
│   ├── config.py           # Loads Firebase settings
│   ├── admin.py            # Initializes Firebase Admin SDK app
│   ├── collections.py      # Collection names constants
│   ├── auth.py             # User authentication wrappers
│   ├── storage.py          # File upload/download storage wrappers
│   └── firestore.py        # DatabaseProvider setup
├── repositories/           # Repository Layer
│   ├── base.py             # Base repository containing local file database fallback
│   ├── analysis_repository.py
│   ├── brief_repository.py
│   ├── event_repository.py
│   ├── citation_repository.py
│   ├── schedule_repository.py
│   └── cache_repository.py
└── tests/                  # Backend Pytest suite
    ├── test_health.py      # Health routing tests
    ├── test_db.py          # Firestore database repository CRUD testing
    ├── test_providers.py   # Swappable providers and caching unit tests
    └── test_brief_provenance.py # Markdown brief structure guardrails
```

---

## 3. Data & Persistence Layer

StratOS AI uses **Firebase Cloud Firestore** for persistent storage, falling back to a local JSON file database (`firebase_local.json`) for offline development when no Firebase credentials are configured.

### Database Abstraction Layer (`core/database/client.py`)
- Business logic communicates exclusively through the facade and repository interfaces.
- The facade delegates operations to specific repositories:
  - **`AnalysisRepository`**: Manages target analyses metadata and processing status.
  - **`BriefRepository`**: Stores the final strategic brief, scores, and decisions.
  - **`EventRepository`**: Logs agent execution progress and attributes citations.
  - **`ScheduleRepository`**: Manages cron jobs for automated reports.
  - **`CacheRepository`**: Handles 24-hour scraped page caching.

---

## 4. Environment & Setup Checklist

To run the application locally, define the following variables in a `.env` file at the root:

```bash
# ── OpenRouter Configuration ──────────────────────────────────────────────────
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# ── Provider Selection ────────────────────────────────────────────────────────
SEARCH_PROVIDER=duckduckgo
PLAYWRIGHT_ENABLED=true
CACHE_ENABLED=true

# ── Firebase Configuration ────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_APP_ID=your-app-id
```

### Running Commands

#### Running the Backend API:
```bash
uv sync
uv run uvicorn app.api.main:app --reload --port 8000
```

#### Running the Frontend Workspace:
```bash
npm install
npm run dev
```

#### Running Verification Tests:
```bash
uv run pytest
```
