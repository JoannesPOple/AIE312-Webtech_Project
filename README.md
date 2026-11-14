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
.env.example               List of environment variable names
render.yaml                Render configuration for the backend
```

## How the parts work together

The browser loads the React website from `FE`. The website requests team data and sends chat questions to the Express server in `BE`. The server adds the portfolio data as context and sends the question to Gemini. It then returns Gemini's answer to the website.

```text
User → FE → BE → Gemini API → BE → FE → User
```

The API key is used only by the backend. If `GEMINI_API_KEY` is empty, `/api/chat` returns a demo message instead of contacting Gemini.

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
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
```

Keep `.env` private. Do not commit it or put the Gemini key in `FE` code. The `.env.example` file is a template and should not contain a real key.

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

## Deployment preparation

`render.yaml` describes the backend service on Render. Before deploying, set `GEMINI_API_KEY` and `CLIENT_URL` in the backend service environment. `CLIENT_URL` must be the deployed frontend's origin, without `/api`.

The frontend must also be deployed as a static site. In the frontend host's build settings, use `FE` as the root directory, `npm install` as the install command, `npm run build` as the build command, and `dist` as the publish directory. Set `VITE_API_URL` to the deployed backend URL plus `/api` (for example, `https://your-backend.example/api`) before building the frontend.

After deployment, test the live `/api/health`, `/api/portfolio`, and chat route. The actual public URLs depend on the hosting accounts and service names, so they are not listed here.

## CI on GitHub

The workflow at `.github/workflows/ci.yml` runs on pushes and pull requests. It installs dependencies, runs `npm run lint`, and runs `npm run build` using Node.js 20. It checks the project; it does not deploy it.

## Explaining the project

You can describe it to your professor like this:

> “This is a team portfolio website with an AI chat assistant. The React frontend displays member information and sends chat questions to an Express backend. The backend reads the team's JSON portfolio data and sends it with the question to Gemini. The Gemini API key stays on the backend. GitHub Actions checks the code, and the backend has a Render deployment configuration.”

The team data is in one JSON file, so it is easy to update without changing the page components. The frontend and backend are separate so the browser does not need access to the secret Gemini key.
