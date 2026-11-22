# Team AI Portfolio

A beginner-friendly team portfolio website with a chat assistant. The frontend displays team information. The backend provides that information and can ask Gemini to answer questions using the portfolio data.

## Project layout

```text
FE/                       React + TypeScript + Vite website
  src/App.tsx              Portfolio cards and chat interface
BE/                       Node.js + Express API
  src/server.ts            API routes and Gemini request
  src/data/portfolio.json  Team and member information
docs/                      Project notes and implementation prompt
.github/workflows/ci.yml   Checks code on GitHub push and pull request
.github/workflows/deploy-pages.yml  Deploys the frontend to GitHub Pages
.env.example               List of environment variable names
render.yaml                Render configuration for the backend
```

## Architecture

**Live site:** <https://joannespople.github.io/AIE312-Webtech_Project/> · **API:** <https://team-ai-portfolio-api.onrender.com/api/health>

### System overview

The website is static files on GitHub Pages. Everything that needs a secret or a server (team data API, AI chat) runs on the Express backend on Render. Only the backend talks to Gemini, so the API key never reaches the browser.

```mermaid
flowchart LR
    User(["👤 Visitor's browser<br/>React app"])

    subgraph GH["GitHub Pages (static hosting)"]
        FE["FE build<br/>HTML · JS · CSS · photos<br/>+ bundled copy of portfolio.json"]
    end

    subgraph RENDER["Render (Node.js server)"]
        BE["Express API<br/>/api/health · /api/portfolio<br/>/api/chat · /api/chat/history"]
        DATA[("portfolio.json<br/>team data")]
        ENV{{"GEMINI_API_KEY<br/>(secret, server only)"}}
    end

    GEMINI["Google Gemini<br/>gemini-3.8-flash<br/>fallback: gemini-3.5-flash-lite"]
    DB[("PostgreSQL<br/>chat history<br/>(optional)")]

    User -- "1. loads the site" --> FE
    User -- "2. team data + chat (HTTPS, CORS-checked)" --> BE
    BE -- reads --> DATA
    BE -. uses .-> ENV
    BE -- "3. question + team data" --> GEMINI
    BE -. "saves messages if DATABASE_URL is set" .-> DB
```

| Part | Technology | Hosted on | Responsibility |
|---|---|---|---|
| Frontend (`FE`) | React, TypeScript, Vite | GitHub Pages | Shows the team, flip cards, missions and chat; falls back to its bundled data if the API is down |
| Backend (`BE`) | Node.js, Express, TypeScript | Render (free plan) | Serves team data, checks CORS, keeps the Gemini key, calls Gemini |
| Team data | `BE/src/data/portfolio.json` | In the repo | Single source of truth for the page, the API and the AI |
| AI | Google Gemini (`@google/genai`) | Google | Writes answers grounded in the team data |
| Chat storage | PostgreSQL (`pg`) | Optional | Saves questions and answers when `DATABASE_URL` is set |

### How a chat message flows

```mermaid
sequenceDiagram
    actor V as Visitor
    participant FE as Frontend (browser)
    participant BE as Express API (Render)
    participant G as Google Gemini

    V->>FE: Types a question or clicks a suggestion
    FE->>BE: POST /api/chat { message }
    BE->>BE: Check message and GEMINI_API_KEY
    BE->>G: Question + system instruction + portfolio.json
    alt model retired or overloaded
        G-->>BE: Error (404 / 503)
        BE->>G: Retry with next model in the fallback list
    end
    G-->>BE: Answer text
    BE-->>FE: { reply }
    FE-->>V: Reply typed out letter by letter
```

The system instruction tells Gemini to answer **only** from the team data, to say so when the data doesn't have the answer, and to reply in the visitor's language in plain text. If every model fails, the API returns `{ "error": "AI service is unavailable" }` (HTTP 502). If `GEMINI_API_KEY` is empty, it returns a demo message instead of contacting Gemini.

### CI/CD pipeline

One push to `main` runs CI and both deployments in parallel. In each lane, a failed step stops the steps after it, so the live version is only replaced by code that passed.

```mermaid
flowchart LR
    PUSH(["git push to main"])

    subgraph CI["CI · .github/workflows/ci.yml<br/>(also every branch + pull request)"]
        direction LR
        C1["npm run lint<br/>type check FE + BE"] --> C2["npm run build"] --> C3["✅ / ❌ on the commit"]
    end

    subgraph CDFE["CD frontend · .github/workflows/deploy-pages.yml"]
        direction LR
        F1["build job<br/>lint + build:pages<br/>(uses VITE_API_URL)"] --> F2["deploy job<br/>publish FE/dist"] --> F3["🌐 github.io"]
    end

    subgraph CDBE["CD backend · render.yaml"]
        direction LR
        B1["npm install + build"] --> B2["npm start<br/>health check /api/health"] --> B3["🌐 onrender.com"]
    end

    PUSH --> C1
    PUSH --> F1
    PUSH --> B1
```

### Configuration

| Variable | Used by | Where it is set | Secret? |
|---|---|---|---|
| `GEMINI_API_KEY` | Backend | `.env` locally, Render dashboard live | **Yes** |
| `GEMINI_MODEL` | Backend | `.env`, `render.yaml` | No |
| `CLIENT_URL` | Backend (CORS, comma-separated) | `.env`, `render.yaml` | No |
| `DATABASE_URL` | Backend (optional) | `.env` | Yes, if used |
| `VITE_API_URL` | Frontend build | `.env` locally, GitHub repository variable for Pages | No (ends up in public JS) |

## Requirements

- Node.js and npm
- A Gemini API key to get real AI answers (optional while developing the rest of the website)

## Install and configure

Open a terminal in the project root (the folder containing this README and the root `package.json`), then run:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and fill in `GEMINI_API_KEY` to enable real Gemini answers:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://user:password@localhost:5432/team_ai_portfolio
```

Keep `.env` private. Do not commit it or put the Gemini key in `FE` code. The `.env.example` file is a template and should not contain a real key.

Set `DATABASE_URL` to a PostgreSQL connection string. The backend creates the `chat_messages` table on startup and stores chat history through `/api/chat/history`.

## Run locally

From the project root:

```powershell
npm run dev
```

Open the frontend at <http://localhost:5173>. The backend uses `PORT` from `.env` (3000 by default).

If the combined command does not start both services in your terminal, use two terminals, both opened in the project root:

```powershell
npm run dev --workspace=BE
```

```powershell
npm run dev --workspace=FE
```

Stop a running service with `Ctrl+C`.

## Update portfolio information

Edit `BE/src/data/portfolio.json`. Keep valid JSON syntax: use double quotes around property names and text, separate list items with commas, and do not add comments. The current data shape has a team name, description, and a `members` list. Each member has an `id`, `name`, `role`, `bio`, `skills`, and `projects`.

Example member:

```json
{
  "id": "member-1",
  "name": "Your Name",
  "role": "Frontend Developer",
  "bio": "A short introduction.",
  "skills": ["React", "TypeScript"],
  "projects": []
}
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Reports `{ "status": "ok" }` when the backend is running |
| GET | `/api/portfolio` | Returns the contents of `portfolio.json` |
| POST | `/api/chat` | Accepts `{ "message": "your question" }` and returns a reply |

Check the backend in PowerShell while it is running:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/portfolio
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/chat -ContentType 'application/json' -Body '{"message":"Who is on the team?"}'
```

If you changed `PORT`, replace `3000` in these URLs with that port.

## Check and build

Run these commands from the project root:

```powershell
npm run lint
npm run build
```

`lint` runs TypeScript checks for both workspaces. `build` creates the frontend production files in `FE/dist` and compiles the backend into `BE/dist`.

## Deployment

- **Backend (Render):** `render.yaml` is a Render Blueprint. Render builds `BE` and runs `npm start`. Set `GEMINI_API_KEY` in the Render dashboard (without quotes). `CLIENT_URL` in `render.yaml` already allows the GitHub Pages site and localhost.
- **Frontend (GitHub Pages):** `.github/workflows/deploy-pages.yml` builds `FE` with `npm run build:pages` (base path `/AIE312-Webtech_Project/`) and publishes it. It reads the backend address from the GitHub repository variable `VITE_API_URL` (`https://team-ai-portfolio-api.onrender.com/api`). GitHub Pages must be set to **Source: GitHub Actions** in the repository settings.

Render's free plan sleeps after 15 minutes without traffic, so the first chat reply after a pause can take 30–60 seconds.

## CI on GitHub

The workflow at `.github/workflows/ci.yml` runs on every push and pull request. It installs dependencies, runs `npm run lint`, and runs `npm run build`. Deployment is handled separately by `deploy-pages.yml` and Render (see [CI/CD pipeline](#cicd-pipeline)).

## Explaining the project

You can describe it to your professor like this:

> “This is a team portfolio website with an AI chat assistant. The React frontend displays member information and sends chat questions to an Express backend. The backend reads the team's JSON portfolio data and sends it with the question to Gemini. The Gemini API key stays on the backend. GitHub Actions checks the code, and the backend has a Render deployment configuration.”

The team data is in one JSON file, so it is easy to update without changing the page components. The frontend and backend are separate so the browser does not need access to the secret Gemini key.
