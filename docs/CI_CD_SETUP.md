# CI/CD Setup & GitHub Secrets Guide

This document specifies the required GitHub Actions secrets and pipeline execution setup for the College Event Management System.

## Required GitHub Actions Secrets

Navigate to your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret** and register the following:

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Your GCP Project ID | `college-events-prod-1234` |
| `GCP_SA_KEY` | Raw JSON string content of `sa-key.json` | `{"type": "service_account", ...}` |
| `SUPABASE_URL` | Supabase project API URL | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anonymous key for client access | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged service role key | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret for token verification | `32+ character secret string` |
| `MISTRAL_API_KEY` | API Key for Mistral AI LLM endpoints | `mistral-api-key-string` |

## Pipeline Safety Rules

1. **Zero Failing Tests Policy**:
   - The backend workflow (`.github/workflows/backend-ci-cd.yaml`) will abort the build & deployment stages immediately if `pytest` encounters any test failure.
   - The frontend workflow (`.github/workflows/frontend-ci-cd.yaml`) will abort if TypeScript type-checking (`tsc --noEmit`) or linting fails.
2. **Deterministic Releases**:
   - Every Docker build tags images with both `$GITHUB_SHA` and `latest`.
   - Deployments execute rolling updates on GKE namespace `campus-events` and monitor rollout health with `kubectl rollout status`.

