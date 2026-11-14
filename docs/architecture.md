# Project Architecture

## Main layers

- `FE`: React UI for Portfolio and Chat
- `BE`: Express API, prompt construction, and Gemini integration
- `BE/src/data/portfolio.json`: single source of truth for team data
- `.github/workflows`: CI/CD automation

## Planned API

- `GET /api/health`
- `GET /api/portfolio`
- `POST /api/chat`
