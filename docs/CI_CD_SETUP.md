# CI/CD Setup & GitHub Actions Automation Guide

This guide details the complete Continuous Integration and Continuous Deployment (CI/CD) configuration for the **College Event Management System** deploying to Google Kubernetes Engine (GKE) and Google Cloud Artifact Registry.

---

## 1. Overview of Automated Pipelines

The repository features two independent, decoupled GitHub Actions workflows under `.github/workflows/`:

1. **Backend Pipeline (`.github/workflows/backend-ci-cd.yaml`)**:
   - **Triggers**: Pushes to `main` impacting `backend/**`, `k8s/**`, or the workflow file itself.
   - **Quality Gate**: Sets up Python 3.11 and runs the full Pytest test suite (`pytest tests/ -v`).
   - **Containerization & Deployment**: Builds hardened non-root container image, tags with `$GITHUB_SHA` and `latest`, pushes to GCP Artifact Registry, updates GKE deployment `backend-deployment`, and monitors rolling status.

2. **Frontend Pipeline (`.github/workflows/frontend-ci-cd.yaml`)**:
   - **Triggers**: Pushes to `main` impacting `frontend/**` or the workflow file itself.
   - **Quality Gate**: Runs ESLint, TypeScript compiler type-check (`tsc --noEmit`), and Next.js standalone build verification.
   - **Containerization & Deployment**: Builds multi-stage standalone Alpine container image, pushes to Artifact Registry, executes rolling update on `frontend-deployment`, and validates pod health.

---

## 2. Required GitHub Actions Secrets

Navigate to your GitHub repository:  
**Settings > Secrets and variables > Actions > New repository secret** and register the following:

| Secret Name | Category | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Infrastructure | Google Cloud Project ID | `college-events-prod-2026` |
| `GCP_SA_KEY` | Authentication | Raw JSON service account key for CI/CD agent | `{"type": "service_account", "project_id": ...}` |
| `SUPABASE_URL` | Database | Supabase project API endpoint URL | `https://xyzproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Database | Supabase public anonymous API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | Privileged service role key (backend bypass) | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Security | JWT signing secret for bearer verification | `32+ character high-entropy string` |
| `MISTRAL_API_KEY` | AI Engine | Mistral AI API key for LLM endpoints | `mistral-api-key-string` |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase public URL (bundled in client) | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key (bundled in client) | `eyJhbGciOi...` |

---

## 3. Google Cloud Platform (GCP) IAM Setup

To generate the required `GCP_SA_KEY` with least-privilege access, execute the following commands using Cloud Shell or `gcloud`:

```bash
# 1. Set environment variables
export PROJECT_ID="your-gcp-project-id"
export SA_NAME="github-actions-deployer"
export REGION="us-central1"
export REPO_NAME="campus-events-repo"

gcloud config set project $PROJECT_ID

# 2. Enable necessary Google APIs
gcloud services enable \
    artifactregistry.googleapis.com \
    container.googleapis.com

# 3. Create Artifact Registry Docker Repository
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for CampusEvents micro-services"

# 4. Create Service Account for GitHub Actions
gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions GKE Deployment Account"

# 5. Grant minimal required IAM roles
# Allow pushing container images to Artifact Registry
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Allow deploying and managing pods on GKE cluster
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/container.developer"

# 6. Generate and export private JSON key for GitHub Actions
gcloud iam service-accounts keys create sa-key.json \
    --iam-account="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 7. Print JSON content to copy into GitHub secret GCP_SA_KEY
cat sa-key.json
```

---

## 4. Pipeline Safety & Reliability Guarantees

1. **Zero-Failing-Tests Gate**:
   - The deployment job declares `needs: test` (or `needs: lint-and-typecheck`).
   - If any unit test, lint error, or type failure occurs, execution halts immediately; no image is pushed, and no cluster update is triggered.
2. **Deterministic Version Pinning**:
   - Every commit produces an immutable image tag: `IMAGE_TAG=.../backend:${GITHUB_SHA}`.
   - The rolling deployment explicitly specifies the exact commit SHA, ensuring auditable releases.
3. **Automated Rollout Monitoring**:
   - `kubectl rollout status deployment/... --timeout=180s` monitors pod lifecycle.
   - If containers fail readiness probes (`/healthz` on backend or port 3000 on frontend), Kubernetes retains previous healthy replica pods and aborts the deployment.

---

## 5. Emergency Rollback Instructions

If an unexpected production issue arises after deployment, roll back immediately with:

```bash
# Roll back backend deployment to previous revision
kubectl rollout undo deployment/backend-deployment -n campus-events

# Roll back frontend deployment to previous revision
kubectl rollout undo deployment/frontend-deployment -n campus-events

# Inspect rollout history
kubectl rollout history deployment/backend-deployment -n campus-events
```
