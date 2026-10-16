<#
.SYNOPSIS
    Quick-Start Existing Minikube Cluster (No Rebuilding)
.DESCRIPTION
    Starts the existing Minikube cluster using current deployed versions:
    1. Verifies Docker Desktop is running
    2. Starts/resumes Minikube (without rebuilding or pulling new images)
    3. Ensures Ingress addon is active
    4. Applies/verifies Kubernetes manifests
    5. Opens Minikube Tunnel in a separate window
    6. Opens the Auto-Deploy Watcher in a separate window
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = "d:\My_Space\Sem 7\ACC\ACC-Mini-Project"
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Campus Events - Quick Start (Existing Deployments)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Docker Desktop
Write-Host "`n[Step 1/4] Verifying Docker Desktop is running..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "[OK] Docker is running." -ForegroundColor Green
} catch {
    Write-Error "Docker Desktop is not running. Please start Docker Desktop and rerun."
    exit 1
}

# 2. Start / Resume Minikube
Write-Host "`n[Step 2/4] Starting existing Minikube cluster..." -ForegroundColor Yellow
minikube start --driver=docker
minikube addons enable ingress

# 3. Apply manifests (ensures pods and ingress are active)
Write-Host "`n[Step 3/4] Ensuring Kubernetes services and pods are active..." -ForegroundColor Yellow
kubectl apply -k k8s/base

Write-Host "Checking pod status..." -ForegroundColor Yellow
kubectl get pods -n campus-events

# 4. Spawn Tunnel and Watcher in background windows
Write-Host "`n[Step 4/4] Launching Minikube Tunnel and Auto-Deploy Watcher..." -ForegroundColor Yellow

# Launch Minikube Tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Minikube Network Tunnel (Active)' -ForegroundColor Cyan; minikube tunnel"

# Launch Auto-Deploy Watcher
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; .\scripts\auto-deploy-watch.ps1"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Campus Events System is Ready!                         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  - Frontend & API: http://localhost" -ForegroundColor White
Write-Host "  - Tunnel Window: Opened (routing port 80)" -ForegroundColor White
Write-Host "  - Watcher Window: Opened (monitoring GitHub for new releases)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
