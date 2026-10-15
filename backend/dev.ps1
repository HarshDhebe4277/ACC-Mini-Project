# PowerShell script to run the backend development server
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Starting Campus Event Management System Backend" -ForegroundColor Green
Write-Host " Local API URL : http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host " Swagger Docs  : http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host " Health Check  : http://127.0.0.1:8000/healthz" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path $VenvPython) {
    & $VenvPython run.py
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python run.py
} else {
    Write-Error "Python executable or .venv not found. Please activate your virtual environment or install Python."
}
