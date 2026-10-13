import os
import pytest


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Ensure baseline environment variables for deterministic test execution."""
    monkeypatch.setenv("PROJECT_NAME", "College Event Management System (Test)")
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("SUPABASE_URL", "https://test-project.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key-valid")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key-valid")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret-at-least-32-chars-long-123456")
    monkeypatch.setenv("MISTRAL_API_KEY", "test-mistral-api-key")
    monkeypatch.setenv("QR_HMAC_SECRET", "test-qr-hmac-secret-min-32-chars-secure")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

