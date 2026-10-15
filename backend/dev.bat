@echo off
cd /d "%~dp0"
echo ============================================================
echo  Starting Campus Event Management System Backend
echo  Local API URL : http://127.0.0.1:8000
echo  Swagger Docs  : http://127.0.0.1:8000/docs
echo  Health Check  : http://127.0.0.1:8000/healthz
echo ============================================================

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" run.py
) else (
    python run.py
)
pause
