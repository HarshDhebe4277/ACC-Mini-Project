<#
.SYNOPSIS
    Automated Continuous Deployment Watcher for Minikube
.DESCRIPTION
    Polls GitHub repository for new commits.
    When a new commit is detected on 'main', it pulls latest changes, waits for GitHub Actions
    to finish publishing the new container image to GHCR (or builds locally if -LocalBuild is set),
    and triggers a zero-downtime rolling update in Minikube.
#>

[CmdletBinding()]
param(
    [string]$Branch = "main",
    [int]$PollIntervalSeconds = 15,
    [switch]$LocalBuild
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Minikube CI/CD Continuous Deployment Watcher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Point Docker CLI to Minikube
Write-Host "Connecting to Minikube environment..." -ForegroundColor Yellow
try {
    & minikube -p minikube docker-env --shell powershell | Invoke-Expression
    Write-Host "[OK] Connected to Minikube" -ForegroundColor Green
} catch {
    Write-Warning "Could not connect to Minikube daemon. Ensure Minikube is started (minikube start)."
}

Write-Host "Watching for new commits on '$Branch' every $PollIntervalSeconds seconds..." -ForegroundColor Cyan

while ($true) {
    try {
        # Fetch remote updates silently
        git fetch origin $Branch 2>$null | Out-Null
        $LOCAL = (git rev-parse HEAD).Trim()
        $REMOTE = (git rev-parse "origin/$Branch").Trim()

        if ($LOCAL -ne $REMOTE) {
            Write-Host "`n[CI/CD Event] New commit detected on GitHub: $REMOTE" -ForegroundColor Yellow
            Write-Host "Pulling latest changes..." -ForegroundColor Yellow
            git pull origin $Branch

            if ($LocalBuild) {
                Write-Host "[-LocalBuild mode] Rebuilding images inside Minikube..." -ForegroundColor Cyan
                & minikube -p minikube docker-env --shell powershell | Invoke-Expression
                docker build -t ghcr.io/harshdhebe4277/acc-mini-project/backend:latest ./backend
                docker build -t ghcr.io/harshdhebe4277/acc-mini-project/frontend:latest ./frontend
            } else {
                Write-Host "[GHCR mode] Waiting 90s for GitHub Actions to build and publish images to ghcr.io..." -ForegroundColor Cyan
                Start-Sleep -Seconds 90
            }

            Write-Host "Triggering Kubernetes zero-downtime rolling restart from GHCR..." -ForegroundColor Cyan
            kubectl rollout restart deployment/backend-deployment -n campus-events
            kubectl rollout restart deployment/frontend-deployment -n campus-events

            Write-Host "Monitoring rollout status (pulling fresh images from ghcr.io)..." -ForegroundColor Yellow
            kubectl rollout status deployment/backend-deployment -n campus-events --timeout=180s
            kubectl rollout status deployment/frontend-deployment -n campus-events --timeout=180s

            Write-Host "`n[SUCCESS] Rolling deployment complete! Running commit: $REMOTE" -ForegroundColor Green
            Write-Host "----------------------------------------------------------"
        }
    } catch {
        Write-Warning "Watcher notice: $_"
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}
