# College Event Management System (Cloud Native CI/CD)

A cloud-native College Event Management System featuring Role-Based Access Control (RBAC), AI-powered event generation, digital QR pass validation, and CI/CD deployment with GitHub Actions, GitHub Container Registry (GHCR), and Local Minikube Kubernetes / GKE.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, PWA (Service Workers)
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, Uvicorn, Supabase-py
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS), Google OAuth 2.0
- **AI Engine**: LangChain + Mistral AI (Event drafting & sentiment summarization)
- **Containerization**: Multi-stage Dockerfiles
- **Orchestration**: Local Minikube Kubernetes (NGINX Ingress) / Google Kubernetes Engine (GKE)
- **CI/CD**: GitHub Actions & GitHub Container Registry (GHCR)
- **Public Tunneling**: Cloudflare Tunnel (`cloudflared`) for secure live HTTPS access

## Repository Structure

```
├── .github/workflows/       # GitHub Actions CI/CD pipelines (GHCR + automated testing)
├── backend/                 # FastAPI REST API backend
│   ├── app/                 # Application code (api, core, models, services)
│   └── tests/               # Pytest automated test suites
├── frontend/                # Next.js 14 App Router frontend
├── k8s/                     # Kubernetes manifests (base & overlays with NGINX Ingress)
├── supabase/                # Database migrations & seed scripts
├── docs/                    # Technical & setup documentation
└── docs/progress_tracker.md # Granular development progress tracker
```

## Getting Started

- **Local Minikube & Cloudflare Tunneling**: Follow [docs/LOCAL_MINIKUBE_CICD_SETUP.md](docs/LOCAL_MINIKUBE_CICD_SETUP.md) for 100% free local Kubernetes execution with public HTTPS access.
- **CI/CD Setup Guide**: See [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) for pipeline details and GHCR container publishing.
- **Architecture & System Design**: Refer to [docs/ARCHITECHTURE.md](docs/ARCHITECHTURE.md).
- **Academic Lab Report**: Review [docs/LAB_REPORT.md](docs/LAB_REPORT.md).
- **Active Implementation Status**: Tracked in [docs/progress_tracker.md](docs/progress_tracker.md).
