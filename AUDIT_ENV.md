# StratOS-AI — Environment & Secrets Audit (`AUDIT_ENV.md`)

## 1. Environment Variables Inventory

*(Values are omitted to prevent credential exposure; statuses indicate runtime presence and usability)*

| Variable | Required | Loaded in Environment? | Usable / Valid? | Used By | Architectural Purpose |
|---|---|---|---|---|---|
| `OPENROUTER_API_KEY` | **YES** | **YES** | **YES** | `intelligence/agents/base/llm.py` | Authenticates to OpenRouter API |
| `OPENROUTER_MODEL` | NO | **YES** | **IGNORED** | `backend/config/config.py` | Model name in `.env` (ignored by `llm.py`) |
| `OPENROUTER_BASE_URL` | NO | Default (`https://openrouter.ai/api/v1`) | **YES** | `intelligence/agents/base/llm.py` | OpenRouter endpoint base URL |
| `OPENROUTER_FREE_MODELS`| NO | Hardcoded list in `config.py` | **FLAWED** | `intelligence/agents/base/llm.py` | Rotation list of 4 free-tier models |
| `SEARCH_PROVIDER` | NO | **YES** (`duckduckgo`) | **YES** | `backend/config/config.py`, `manager.py` | Search engine selection |
| `BRAVE_API_KEY` | NO | NO (empty string) | N/A | `intelligence/tools/manager.py` | Optional fallback search provider |
| `PLAYWRIGHT_ENABLED` | NO | **YES** (`true`) | **HAZARDOUS** | `intelligence/tools/browser/playwright.py` | Enables headless Chromium (hangs on Windows) |
| `CACHE_ENABLED` | NO | **YES** (`true`) | **YES** | `intelligence/cache/cache.py` | Cache lookup toggle |
| `SEARCH_TIMEOUT` | NO | Default (`15.0`) | **YES** | `backend/config/config.py` | Timeout for search operations |
| `FETCH_TIMEOUT` | NO | Default (`30.0`) | **YES** | `backend/config/config.py`, `requests.py` | Timeout for HTTP fetching |
| `BROWSER_TIMEOUT` | NO | Default (`35.0`) | **YES** | `backend/config/config.py`, `playwright.py`| Timeout for browser page renders |
| `DATABASE_URL` | NO | NO (empty string) | N/A | `backend/config/config.py` | Optional relational DB connection |
| `FIREBASE_PROJECT_ID` | NO | **YES** | **YES** | `database/firebase/admin.py` | Firebase Admin project ID |
| `FIREBASE_PRIVATE_KEY_ID`| NO | **YES** | **YES** | `database/firebase/admin.py` | Service account private key ID |
| `FIREBASE_PRIVATE_KEY` | NO | **YES** | **YES** | `database/firebase/admin.py` | Service account private key |
| `FIREBASE_CLIENT_EMAIL` | NO | **YES** | **YES** | `database/firebase/admin.py` | Service account client email |
| `FIREBASE_CLIENT_ID` | NO | **YES** | **YES** | `database/firebase/admin.py` | Service account client ID |
| `FIREBASE_CLIENT_CERT_URL`| NO | **YES** | **YES** | `database/firebase/admin.py` | Service account cert URL |
| `FIREBASE_API_KEY` | NO | NO (empty string) | N/A | `database/firebase/config.py` | Client API key |
| `FIREBASE_AUTH_DOMAIN` | NO | NO (empty string) | N/A | `database/firebase/config.py` | Client Auth domain |
| `FIREBASE_STORAGE_BUCKET`| NO | NO (empty string) | N/A | `database/firebase/config.py` | Client Storage bucket |
| `FIREBASE_APP_ID` | NO | NO (empty string) | N/A | `database/firebase/config.py` | Client App ID |
| `NEXT_PUBLIC_API_URL` | NO | Default (`http://localhost:8000`) | **YES** | `frontend/app/dashboard/page.tsx` | Backend URL for frontend calls |
| `FRONTEND_URL` | NO | NO (empty string) | Defaults to `http://localhost:3000` | `backend/main.py` | Allowed CORS origin |

---

## 2. Environment Configuration Deficiencies

### Defect 1: `.env` vs `OPENROUTER_MODEL` Disconnect
- The `.env.example` file explicitly documents:
  ```bash
  OPENROUTER_API_KEY=
  OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
  ```
- Developers setting up the project and supplying their OpenRouter API key naturally believe they are executing Claude 3.5 Sonnet.
- In reality, `intelligence/agents/base/llm.py` completely bypasses `OPENROUTER_MODEL` and forces the pipeline into `openrouter_free_models`, subjecting the application to public rate limits and overloaded free endpoints.

### Defect 2: Firebase Admin SDK Race Condition in Concurrent Environments
- When `FIREBASE_PROJECT_ID` and credentials are provided, `database/firebase/admin.py` runs:
  ```python
  if _app is None:
      ...
      _app = firebase_admin.initialize_app(cred, options)
  ```
- Because there is no concurrency lock (`threading.Lock` or `asyncio.Lock`), when multiple steps in Researcher invoke cache/DB operations concurrently, multiple threads find `_app is None` and concurrently invoke `firebase_admin.initialize_app()`.
- This triggers:
  ```text
  ValueError: The default Firebase app already exists. This means you called initialize_app() more than once...
  ```

### Defect 3: Relative Path for Local Fallback DB (`LOCAL_DB_FILE`)
- In `database/repositories/base.py`, line 8:
  ```python
  LOCAL_DB_FILE = "firebase_local.json"
  ```
- When the server is started from `StratOS-AI/backend/`, it writes to `StratOS-AI/backend/firebase_local.json`.
- When tests or CLI commands are run from `StratOS-AI/`, they write to `StratOS-AI/firebase_local.json`.
- This fractures persistence into two desynchronized files.
