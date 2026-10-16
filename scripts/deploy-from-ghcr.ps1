<#
.SYNOPSIS
    Deploy published GHCR images to local Minikube
.DESCRIPTION
    Pulls pre-built container images published by GitHub Actions from GitHub Container Registry (GHCR)
    and updates the local Minikube deployments.
#>

[CmdletBinding()]
param(
    [string]$Owner = "HarshDhebe4277",
    [string]$Repo = "acc-mini-project",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

# Lowercase repo name for GHCR standard
$Owner = $Owner.ToLower()
$Repo = $Repo.ToLower()

$BackendImage = "ghcr.io/$Owner/$Repo/backend:$Tag"
$FrontendImage = "ghcr.io/$Owner/$Repo/frontend:$Tag"

Write-Host "Updating Minikube deployments to GHCR images:" -ForegroundColor Cyan
Write-Host "  Backend:  $BackendImage"
Write-Host "  Frontend: $FrontendImage"

# Point to Minikube Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Pull latest images from GHCR
Write-Host "Pulling images from GHCR into Minikube..." -ForegroundColor Yellow
docker pull $BackendImage
docker pull $FrontendImage

# Tag as local for current manifests or update deployment image directly
docker tag $BackendImage campus-events/backend:latest
docker tag $FrontendImage campus-events/frontend:latest

# Trigger rolling restart
Write-Host "Triggering Kubernetes rolling update..." -ForegroundColor Cyan
kubectl rollout restart deployment/backend-deployment -n campus-events
kubectl rollout restart deployment/frontend-deployment -n campus-events

# Await completion
kubectl rollout status deployment/backend-deployment -n campus-events --timeout=120s
kubectl rollout status deployment/frontend-deployment -n campus-events --timeout=120s

Write-Host "[SUCCESS] Minikube is now running the latest container images from GitHub Actions!" -ForegroundColor Green
