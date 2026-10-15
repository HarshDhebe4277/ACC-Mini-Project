import os
import sys
from pathlib import Path

# Ensure the backend directory is in the Python path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure working directory is the backend directory so .env is loaded properly
os.chdir(BACKEND_DIR)

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🚀 Starting Campus Event Management System Backend")
    print("📡 Local API URL : http://127.0.0.1:8000")
    print("📖 Swagger Docs  : http://127.0.0.1:8000/docs")
    print("🩺 Health Check  : http://127.0.0.1:8000/healthz")
    print("=" * 60)

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(BACKEND_DIR / "app")],
    )
