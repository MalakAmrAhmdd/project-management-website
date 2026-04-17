# EBS Project Management

A comprehensive project management web application mimicking Microsoft Project with Excel-like flexibility. Built with Next.js, FastAPI, PostgreSQL, Recharts, and Docker.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js 14     │────▶│  FastAPI      │────▶│ PostgreSQL   │
│  (port 5000)    │     │  (port 8000)  │     │  (port 5432) │
│  App Router     │     │  Async/await  │     │  16-alpine   │
│  TailwindCSS    │     │  SQLAlchemy   │     │              │
│  Recharts       │     │  Alembic      │     │              │
└─────────────────┘     └──────────────┘     └──────────────┘
```

## Data Hierarchy

```
Team
├── Members (with allocation tracking)
└── Projects
    └── Phases
        └── Milestones
            ├── Epics
            │   └── Stories
            └── Allocations (Member ↔ Milestone)
```

## Quick Start

**Single command to run everything:**

```bash
docker compose up --build
```

Then open:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Seed the Database

After the containers are running, seed with sample data:

```bash
docker compose exec backend python -m app.seed
```

## Key Features

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Summary cards, allocation health pie chart, project state bar chart, resource health table, project timeline |
| Resources | `/resources` | Excel-like inline editing of members, contribution matrix expansion, allocation warnings (red/yellow/green) |
| Projects | `/projects` | Project cards, create new projects, navigate to detail views |
| Project Detail | `/projects/[id]` | Full tree hierarchy (Phase→Milestone→Epic→Story) with inline editing at every level |
| Management | `/management` | Milestone selector, contribution matrix, Gantt timeline, analytics, change history |

### Calculation Engine

- **Adaptive end dates**: auto-computed from allocated velocities and estimated points
- **Cascade recalculation**: changes to a story cascade up through epic → milestone → phase → project
- **Allocation tracking**: member allocation % = sum of contribution % across active milestones
  - 🟢 Green: 100% (optimal)
  - 🟡 Yellow: <100% (underutilized)
  - 🔴 Red: >100% (over-allocated)

### Excel-like Editing

- Double-click any cell to edit inline
- Add/remove rows at any hierarchy level
- Drag-and-drop reordering support (API-ready)
- Placeholder auto-creation for new projects

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, TanStack React Query v5, Recharts, Zustand |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| Database | PostgreSQL 16 |
| Infrastructure | Docker Compose |

## Project Structure

```
co-pilot-EPM/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/001_initial.py
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── seed.py
│       ├── models/          # SQLAlchemy models
│       ├── schemas/         # Pydantic schemas
│       ├── services/        # Business logic
│       └── routers/         # API endpoints
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── types/index.ts
        ├── lib/
        │   ├── api.ts       # API client
        │   └── utils.ts     # Utilities
        ├── components/
        │   └── layout/Sidebar.tsx
        └── app/
            ├── layout.tsx
            ├── page.tsx         # Dashboard
            ├── resources/page.tsx
            ├── projects/
            │   ├── page.tsx
            │   └── [id]/page.tsx
            └── management/page.tsx
```

## API Endpoints

All endpoints are documented at `http://localhost:8000/docs` (Swagger UI).

Key endpoints:
- `GET/POST /api/teams` — Team CRUD
- `GET/POST /api/members` — Member CRUD with team filtering
- `GET/POST /api/projects` — Project CRUD
- `GET/POST /api/phases` — Phase CRUD with reordering
- `GET/POST /api/milestones` — Milestone CRUD
- `GET/POST /api/epics` — Epic CRUD
- `GET/POST /api/stories` — Story CRUD
- `GET/POST /api/allocations` — Resource allocation management
- `GET /api/allocations/milestone/{id}/contributions` — Contribution matrix
- `GET /api/dashboard/summary` — Dashboard statistics
- `GET /api/dashboard/resource-health` — Allocation health data
- `GET /api/dashboard/project-timeline` — Full project timeline for Gantt
- `GET /api/changelog` — Change history

## Environment Variables

See `.env.example` for all available configuration options.

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `epmadmin` | Database user |
| `POSTGRES_PASSWORD` | `epmpass2024` | Database password |
| `POSTGRES_DB` | `epm_db` | Database name |
| `DATABASE_URL` | auto | AsyncPG connection string |
| `CORS_ORIGINS` | `["http://localhost:5000"]` | Allowed CORS origins |
