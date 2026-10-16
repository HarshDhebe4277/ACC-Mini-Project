<#
.SYNOPSIS
    One-Click Setup & Launch Script for Minikube, Kubernetes Deployments, Tunnel & Auto-Deploy Watcher
.DESCRIPTION
    Automates the entire local Kubernetes workflow:
    1. Checks Docker Desktop
    2. Starts Minikube cluster
    3. Enables NGINX Ingress controller
    4. Connects Docker to Minikube and builds container images
    5. Deploys Kubernetes manifests (namespace, secrets, config, deployments, services, ingress)
    6. Automatically spawns Minikube Tunnel in a separate window
    7. Automatically spawns the Auto-Deploy Watcher in a separate window
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = "d:\My_Space\Sem 7\ACC\ACC-Mini-Project"
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    Campus Events - Kubernetes 1-Click Launch Script      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Docker
Write-Host "`n[Step 1/6] Verifying Docker Desktop is running..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "[OK] Docker is running." -ForegroundColor Green
} catch {
    Write-Error "Docker Desktop does not appear to be running. Please start Docker Desktop and rerun this script."
}

# 2. Start Minikube
Write-Host "`n[Step 2/6] Starting Minikube cluster..." -ForegroundColor Yellow
minikube start --driver=docker --cpus=2 --memory=4096
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Minikube."
}

# 3. Enable NGINX Ingress
Write-Host "`n[Step 3/6] Enabling NGINX Ingress Addon..." -ForegroundColor Yellow
minikube addons enable ingress

# 4. Fetch Pre-Built Container Images from GitHub Actions (GHCR)
Write-Host "`n[Step 4/6] Fetching images built by GitHub Actions from ghcr.io..." -ForegroundColor Yellow

Write-Host "Pulling Backend image from GHCR..." -ForegroundColor Cyan
minikube image pull ghcr.io/harshdhebe4277/acc-mini-project/backend:latest

Write-Host "Pulling Frontend image from GHCR..." -ForegroundColor Cyan
minikube image pull ghcr.io/harshdhebe4277/acc-mini-project/frontend:latest

# 5. Apply Kubernetes manifests
Write-Host "`n[Step 5/6] Applying Kubernetes manifests with Kustomize..." -ForegroundColor Yellow
kubectl apply -k k8s/base

Write-Host "Waiting for deployments to roll out..." -ForegroundColor Yellow
kubectl rollout status deployment/backend-deployment -n campus-events --timeout=180s
kubectl rollout status deployment/frontend-deployment -n campus-events --timeout=180s

Write-Host "[OK] All pods are running successfully!" -ForegroundColor Green

# 6. Spawn Background Windows: Tunnel and Watcher
Write-Host "`n[Step 6/6] Spawning Minikube Tunnel and Auto-Deploy Watcher..." -ForegroundColor Yellow

# Launch Minikube Tunnel in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Minikube Network Tunnel (Active)' -ForegroundColor Cyan; minikube tunnel"

# Launch Auto-Deploy Watcher in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; .\scripts\auto-deploy-watch.ps1"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Campus Events System is Live and Running!     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  - Frontend & API: http://localhost" -ForegroundColor White
Write-Host "  - Tunnel Window: Opened in separate window (routing port 80)" -ForegroundColor White
Write-Host "  - Auto-Deploy Watcher: Opened in separate window (watching 'main')" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
