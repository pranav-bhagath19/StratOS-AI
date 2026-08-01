# Running StratOS AI Locally

This guide explains how to configure and run the backend, frontend, and background task scheduler (Inngest) for StratOS AI.

---

## Prerequisites

Ensure you have the following installed on your system:
- **Python**: version `3.11` (specified in `.python-version`)
- **uv**: Python package installer and virtual environment manager
- **Node.js**: version `18+` (with `npm` package manager)

---

## 1. Running the Backend

The backend is a FastAPI application situated in the `backend` directory.

### Step 1.1: Navigate and Setup Environment
Open a terminal in the project root and navigate to the `backend` folder:
```powershell
cd backend
```

### Step 1.2: Install Dependencies
Use `uv` to synchronize dependencies and create the virtual environment:
```powershell
uv sync
```

### Step 1.3: Configure Environment Variables
> [!WARNING]
> Do NOT run the copy command if you have already set up your `.env` file, as it will overwrite your active credentials with blank values.
> If you have a `.env` file already, skip this step.

If not already present, copy the `.env.example` from the root or create a `.env` in the `backend` directory:
```powershell
# ONLY run this if .env does NOT exist yet!
Copy-Item ../.env.example .env
```
Open `.env` and fill in the required keys:
*   `OPENROUTER_API_KEY`: Required for LLM/Claude operations.
*   `FIREBASE_*` keys: Optional. If omitted, the backend automatically falls back to the local database file `firebase_local.json`.
*   `SEARCH_PROVIDER`: Defaults to `duckduckgo`. Can be changed to `brave` if you have a `BRAVE_API_KEY`.

### Step 1.4: Run the Backend Server
Start the development server with `uvicorn`. Ensure `PYTHONPATH` points to the workspace root directory so the package imports work correctly:

**From the `backend` folder (PowerShell):**
```powershell
$env:PYTHONPATH=".."
uv run uvicorn main:app --reload --port 8000
```

**Alternatively, from the project root (PowerShell):**
```powershell
$env:PYTHONPATH="."
uv run --project backend uvicorn backend.main:app --reload --port 8000
```

The backend API will be running at **`http://localhost:8000`**. You can verify it by opening the health check page: `http://localhost:8000/health`.

---

## 2. Running the Frontend

The frontend is a Next.js application situated in the `frontend` directory.

### Step 2.1: Navigate to Frontend
Open a new terminal and navigate to the `frontend` directory:
```powershell
cd frontend
```

### Step 2.2: Install Dependencies
Install the required packages using `npm`:
```powershell
npm install
```

### Step 2.3: Configure Environment Variables
Verify your `frontend/.env.local` settings. At minimum, ensure it points to the local backend server:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 2.4: Run the Frontend Development Server
Start the Next.js development server:
```powershell
npm run dev
```

The frontend will be available at **`http://localhost:3000`**. Open this URL in your browser to view the StratOS AI interface.

---

## 3. Running the Inngest Scheduler (Optional)

StratOS AI uses **Inngest** to schedule and trigger recurring analyses. 

To test scheduled analyses locally, run the Inngest dev server in a separate terminal:
```powershell
npx inngest-cli@latest dev -u http://localhost:8000/api/inngest
```

Open the Inngest Dev Server dashboard at **`http://localhost:8288`** to trigger, view, and debug scheduled jobs.

---

## 4. Running Verification and Tests

To ensure everything is working correctly, you can run the suite of unit/integration tests and linting checks.

### Run Backend Tests
From the `backend` directory:
```powershell
uv run pytest
```

### Run Frontend Checks
From the `frontend` directory:
```powershell
# Run linting
npm run lint

# Run TypeScript type check
npx tsc --noEmit

# Test production build
npm run build
```
