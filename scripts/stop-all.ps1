<#
.SYNOPSIS
    Stop Minikube and clean up local resources
#>

Write-Host "Stopping Minikube..." -ForegroundColor Yellow
minikube stop
Write-Host "Minikube stopped." -ForegroundColor Green
