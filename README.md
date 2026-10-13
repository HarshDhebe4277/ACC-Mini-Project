# College Event Management System (Cloud Native CI/CD)

A cloud-native College Event Management System with Role-Based Access Control (RBAC), AI-powered event generation, digital pass validation, and CI/CD deployment on Google Kubernetes Engine (GKE).

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, PWA (Service Workers)
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, Uvicorn, Supabase-py
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS), Google OAuth 2.0
- **AI Engine**: LangChain + Mistral AI (Event drafting & sentiment summarization)
- **Containerization**: Multi-stage Dockerfiles
- **Orchestration**: Google Kubernetes Engine (GKE)
- **CI/CD**: GitHub Actions

## Repository Structure

```
├── .github/workflows/       # GitHub Actions CI/CD pipelines
├── backend/                 # FastAPI REST API backend
│   ├── app/                 # Application code (api, core, models, services)
│   └── tests/               # Pytest automated test suites
├── frontend/                # Next.js 14 App Router frontend
├── k8s/                     # Kubernetes manifests (base & overlays)
├── supabase/                # Database migrations & seed scripts
├── docs/                    # Technical & setup documentation
└── progress_tracker.md      # Granular development progress tracker
```

## Getting Started

Refer to [docs/ARCHITECHTURE.md](docs/ARCHITECHTURE.md) for full engineering specifications and [progress_tracker.md](progress_tracker.md) for active implementation status.

