# CI/CD Setup & GitHub Actions Automation Guide

This guide details the complete Continuous Integration and Continuous Deployment (CI/CD) configuration for the **College Event Management System** using **GitHub Container Registry (GHCR)**, **GitHub Actions**, and deployment to **Local Minikube Kubernetes / GKE**.

---

## 1. Overview of Automated Pipelines

The repository features two independent, decoupled GitHub Actions workflows under `.github/workflows/`:

1. **Backend Pipeline (`.github/workflows/backend-ci-cd.yaml`)**:
   - **Triggers**: Pushes to `main` impacting `backend/**`, `k8s/**`, or the workflow file itself.
   - **Quality Gate**: Sets up Python 3.11 and runs the full Pytest test suite (`pytest tests/ -v`).
   - **Containerization & Publishing**: Builds hardened non-root container image, tags with both `$GITHUB_SHA` and `latest`, and pushes to GitHub Container Registry (`ghcr.io/${{ github.repository }}/backend`).

2. **Frontend Pipeline (`.github/workflows/frontend-ci-cd.yaml`)**:
   - **Triggers**: Pushes to `main` impacting `frontend/**` or the workflow file itself.
   - **Quality Gate**: Runs ESLint, TypeScript compiler type-check (`tsc --noEmit`), and Next.js standalone build verification.
   - **Containerization & Publishing**: Builds multi-stage standalone Alpine container image, pushes to GitHub Container Registry (`ghcr.io/${{ github.repository }}/frontend`), and tags with `$GITHUB_SHA` and `latest`.

---

## 2. GitHub Actions Secrets Configuration

Navigate to your GitHub repository:  
**Settings > Secrets and variables > Actions > New repository secret** and register the following:

| Secret Name | Category | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Database | Supabase project API endpoint URL | `https://xyzproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Database | Supabase public anonymous API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | Privileged service role key (backend bypass) | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Security | JWT signing secret for bearer verification | `32+ character high-entropy string` |
| `MISTRAL_API_KEY` | AI Engine | Mistral AI API key for LLM endpoints | `mistral-api-key-string` |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase public URL (bundled in client) | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key (bundled in client) | `eyJhbGciOi...` |

> [!NOTE]
> GitHub Container Registry (GHCR) authentication is handled **automatically** by GitHub Actions using the built-in `${{ secrets.GITHUB_TOKEN }}` with `packages: write` permission. No manual Docker Hub or cloud container registry credentials are required.

---

## 3. Deployment Models

### Model A: Local Minikube Deployment (Free & Offline-Friendly)
For local evaluation, coursework, and viva demonstrations:
1. Build images directly inside Minikube's Docker daemon or pull from GHCR:
   ```powershell
   # Point Docker CLI to Minikube daemon
   & minikube -p minikube docker-env --shell powershell | Invoke-Expression

   # Build locally
   docker build -t campus-events/backend:latest ./backend
   docker build -t campus-events/frontend:latest ./frontend
   ```
2. Apply Kubernetes base manifests:
   ```powershell
   kubectl apply -k k8s/base
   ```
3. Expose via Minikube tunnel and Cloudflare quick tunnel for live HTTPS public access. See [LOCAL_MINIKUBE_CICD_SETUP.md](LOCAL_MINIKUBE_CICD_SETUP.md) for full instructions.

### Model B: Self-Hosted Runner Continuous Deployment
To have GitHub Actions automatically deploy updates to your running local Minikube cluster:
1. In GitHub Repository: **Settings > Actions > Runners > New self-hosted runner**.
2. Follow the OS instructions to register your machine as a runner.
3. Once active, the runner can execute automated rolling updates:
   ```powershell
   kubectl set image deployment/backend-deployment backend=ghcr.io/<org-or-user>/<repo>/backend:<commit-sha> -n campus-events
   kubectl rollout status deployment/backend-deployment -n campus-events --timeout=120s
   ```

---

## 4. Pipeline Safety & Reliability Guarantees

1. **Zero-Failing-Tests Gate**:
   - The image build and push job declares `needs: test` (or `needs: lint-and-typecheck`).
   - If any unit test, lint error, or type failure occurs, execution halts immediately; no image is pushed, and no cluster update is triggered.
2. **Deterministic Version Pinning**:
   - Every commit produces an immutable image tag: `IMAGE_TAG=ghcr.io/.../backend:${GITHUB_SHA}` as well as `:latest`.
   - The rolling deployment can explicitly specify the exact commit SHA, ensuring auditable releases.
3. **Automated Rollout Monitoring**:
   - `kubectl rollout status deployment/... --timeout=180s` monitors pod lifecycle.
   - If containers fail readiness probes (`/healthz` on backend or TCP port 3000 on frontend), Kubernetes retains previous healthy replica pods and aborts the deployment.

---

## 5. Rollback Instructions

If an unexpected production issue arises after deployment, roll back immediately with:

```bash
# Roll back backend deployment to previous revision
kubectl rollout undo deployment/backend-deployment -n campus-events

# Roll back frontend deployment to previous revision
kubectl rollout undo deployment/frontend-deployment -n campus-events

# Inspect rollout history
kubectl rollout history deployment/backend-deployment -n campus-events
```
