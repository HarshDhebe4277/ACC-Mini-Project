from fastapi.testclient import TestClient
from app.core.config import Settings
from app.main import app


def test_settings_load_cleanly():
    """Verify that Settings loads all required parameters without null pointers."""
    settings = Settings()
    
    assert settings.PROJECT_NAME is not None and len(settings.PROJECT_NAME) > 0
    assert settings.APP_ENV in ["development", "test", "production"]
    assert settings.SUPABASE_URL.startswith("https://")
    assert len(settings.SUPABASE_JWT_SECRET) >= 32
    assert len(settings.QR_HMAC_SECRET) >= 16
    assert isinstance(settings.ALLOWED_ORIGINS, list)
    assert len(settings.ALLOWED_ORIGINS) > 0


def test_healthz_endpoint():
    """Verify that /healthz returns 200 OK and expected status."""
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint():
    """Verify that root endpoint / returns 200 with online status."""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "project" in data

