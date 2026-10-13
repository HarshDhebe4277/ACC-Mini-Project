import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole

client = TestClient(app)


def test_auth_me_unauthenticated():
    """Missing Bearer token should return 401 Unauthorized."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_auth_me_invalid_token():
    """Garbage token should return 401 Unauthorized."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-jwt-token"}
    )
    assert response.status_code == 401


def test_auth_me_valid_student():
    """Valid student JWT should return student profile."""
    token = create_access_token({
        "sub": "student-uuid-1",
        "email": "student@ves.ac.in",
        "role": UserRole.STUDENT.value,
        "user_metadata": {
            "full_name": "Test Student",
            "department": "Information Technology"
        }
    })
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "student-uuid-1"
    assert data["email"] == "student@ves.ac.in"
    assert data["role"] == "STUDENT"
    assert data["full_name"] == "Test Student"


def test_rbac_forbidden_for_student_on_organizer_endpoint():
    """Student attempting to create event draft should receive 403 Forbidden."""
    student_token = create_access_token({
        "sub": "student-uuid-2",
        "email": "student2@ves.ac.in",
        "role": UserRole.STUDENT.value
    })
    payload = {
        "title": "Unauthorized Event",
        "description": "This should be rejected",
        "department": "IT",
        "start_time": "2026-11-01T10:00:00Z",
        "end_time": "2026-11-01T17:00:00Z",
        "registration_deadline": "2026-10-30T23:59:59Z",
        "max_capacity": 50
    }
    response = client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]
