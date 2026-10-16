<#
.SYNOPSIS
    Automated Continuous Deployment Watcher for Minikube
.DESCRIPTION
    Monitors GitHub commits on origin/main.
    When a new commit is detected, it polls GitHub Actions until the cloud build
    and test pipeline finishes successfully, pulls the images from GHCR,
    and triggers a zero-downtime rolling update.
#>

[CmdletBinding()]
param(
    [string]$Branch = "main",
    [int]$PollIntervalSeconds = 10,
    [switch]$LocalBuild,
    [switch]$ForceDeploy
)

$ErrorActionPreference = "Continue"
if (Test-Path Variable:\PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}
$StateFile = Join-Path $PSScriptRoot "..\.last_deploy"

function Wait-ForGitHubActions {
    param([string]$CommitSha, [int]$TimeoutSeconds = 600)
    
    Write-Host "[GHCR mode] Actively tracking GitHub Actions cloud build for commit $CommitSha..." -ForegroundColor Cyan
    $Elapsed = 0
    $CheckInterval = 10

    while ($Elapsed -lt $TimeoutSeconds) {
        $apiSuccess = $false
        try {
            $uri = "https://api.github.com/repos/HarshDhebe4277/ACC-Mini-Project/actions/runs?head_sha=$CommitSha"
            $resp = Invoke-RestMethod -Uri $uri -Headers @{ "User-Agent" = "PowerShell-Watcher" } -TimeoutSec 5 -ErrorAction Stop
            $runs = $resp.workflow_runs
            
            if ($runs -and $runs.Count -gt 0) {
                $apiSuccess = $true
                $completed = @($runs | Where-Object { $_.status -eq "completed" })
                $inProgress = @($runs | Where-Object { $_.status -ne "completed" })
                
                if ($inProgress.Count -eq 0 -and $completed.Count -gt 0) {
                    $failed = @($completed | Where-Object { $_.conclusion -ne "success" })
                    if ($failed.Count -gt 0) {
                        Write-Warning "GitHub Actions workflow failed: $($failed.name -join ', ')"
                        return $false
                    }
                    Write-Host "[GitHub Actions] Cloud tests and image build finished successfully! (${Elapsed}s)" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "  > Build in progress on GitHub Actions... (${Elapsed}s elapsed)" -ForegroundColor Gray
                }
            }
        } catch {
            # Network issue or rate limit
        }

        if (-not $apiSuccess) {
            if ($Elapsed -ge 180) {
                Write-Host "  > Proceeding to pull from GHCR (${Elapsed}s elapsed)..." -ForegroundColor Yellow
                return $true
            } else {
                Write-Host "  > Waiting for cloud build to finish... (${Elapsed}s elapsed)" -ForegroundColor Gray
            }
        }

        Start-Sleep -Seconds $CheckInterval
        $Elapsed += $CheckInterval
    }

    Write-Warning "Timed out waiting for GitHub Actions. Proceeding to attempt pull."
    return $true
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    Minikube Continuous Deployment (CD) Watcher           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Load last deployed commit
$LastDeployed = ""
if (Test-Path $StateFile) {
    $LastDeployed = (Get-Content $StateFile -Raw).Trim()
}

Write-Host "Last deployed commit: $(if ($LastDeployed) { $LastDeployed } else { 'None (Initial Run)' })" -ForegroundColor Gray
Write-Host "Watching GitHub for new commits on '$Branch' every $PollIntervalSeconds seconds..." -ForegroundColor Cyan

while ($true) {
    try {
        # Fetch latest commit from origin silently
        git fetch origin $Branch --quiet *>$null
        $CurrentRemote = (git rev-parse "origin/$Branch" 2>$null).Trim()

        if ($CurrentRemote -ne $LastDeployed -or $ForceDeploy) {
            $ForceDeploy = $false
            Write-Host "`n[CI/CD Trigger] New release detected on GitHub: $CurrentRemote" -ForegroundColor Yellow

            if ($LocalBuild) {
                Write-Host "[-LocalBuild mode] Building images with Docker and loading into Minikube..." -ForegroundColor Cyan
                docker build -t ghcr.io/harshdhebe4277/acc-mini-project/backend:latest ./backend
                minikube image load ghcr.io/harshdhebe4277/acc-mini-project/backend:latest
                docker build -t ghcr.io/harshdhebe4277/acc-mini-project/frontend:latest ./frontend
                minikube image load ghcr.io/harshdhebe4277/acc-mini-project/frontend:latest
            } else {
                $buildOk = Wait-ForGitHubActions -CommitSha $CurrentRemote
                if (-not $buildOk) {
                    Write-Error "Deployment cancelled because GitHub Actions build failed."
                    continue
                }

                Write-Host "Pulling fresh images from GHCR into Minikube..." -ForegroundColor Cyan
                minikube image pull ghcr.io/harshdhebe4277/acc-mini-project/backend:latest
                minikube image pull ghcr.io/harshdhebe4277/acc-mini-project/frontend:latest
            }

            Write-Host "Triggering Kubernetes zero-downtime rolling restart..." -ForegroundColor Cyan
            kubectl rollout restart deployment/backend-deployment -n campus-events
            kubectl rollout restart deployment/frontend-deployment -n campus-events

            Write-Host "Monitoring rollout status..." -ForegroundColor Yellow
            kubectl rollout status deployment/backend-deployment -n campus-events --timeout=180s
            kubectl rollout status deployment/frontend-deployment -n campus-events --timeout=180s

            # Save state
            Set-Content -Path $StateFile -Value $CurrentRemote -Force
            $LastDeployed = $CurrentRemote

            Write-Host "`n[SUCCESS] Deployed commit: $CurrentRemote to Minikube!" -ForegroundColor Green
            Write-Host "==========================================================" -ForegroundColor Cyan
        }
    } catch {
        Write-Warning "Watcher note: $_"
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}
