import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole

client = TestClient(app)

ORGANIZER_TOKEN = create_access_token({
    "sub": "ai-org-1",
    "email": "ai_org@ves.ac.in",
    "role": UserRole.ORGANIZER.value,
    "user_metadata": {"full_name": "AI Organizer", "department": "Computer Science"}
})

STUDENT_TOKEN = create_access_token({
    "sub": "ai-stud-1",
    "email": "ai_stud@ves.ac.in",
    "role": UserRole.STUDENT.value
})

FACULTY_TOKEN = create_access_token({
    "sub": "ai-fac-1",
    "email": "ai_fac@ves.ac.in",
    "role": UserRole.FACULTY.value,
    "user_metadata": {"full_name": "AI Faculty", "department": "Computer Science"}
})


def test_ai_draft_event_rbac_forbidden_for_student():
    """Students should not be allowed to invoke AI event drafting."""
    response = client.post(
        "/api/v1/ai/draft-event",
        json={"rough_prompt": "3-day hackathon with 50k prize", "department": "Computer Science"},
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]


def test_ai_draft_event_short_prompt_validation():
    """Prompt with less than 10 characters should fail schema validation."""
    response = client.post(
        "/api/v1/ai/draft-event",
        json={"rough_prompt": "short", "department": "CS"},
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert response.status_code == 422


def test_ai_draft_event_success_for_organizer():
    """Organizers can generate structured event drafts with AI."""
    response = client.post(
        "/api/v1/ai/draft-event",
        json={
            "rough_prompt": "24-hour inter-college AI hackathon with 50k cash prizes and GCP credits",
            "department": "Computer Science"
        },
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data and len(data["title"]) > 0
    assert "description" in data and "## About the Event" in data["description"]
    assert isinstance(data["tags"], list) and len(data["tags"]) > 0
    assert isinstance(data["suggested_agenda"], list) and len(data["suggested_agenda"]) > 0
    assert data["suggested_capacity"] > 0


def test_ai_summarize_feedback():
    """Verify AI summarizer produces structured insights from feedback submissions."""
    # 1. Create event
    ev_res = client.post(
        "/api/v1/events",
        json={
            "title": "Machine Learning Bootcamp",
            "description": "Intensive hands-on Python & PyTorch bootcamp.",
            "department": "Computer Science",
            "start_time": "2026-12-05T09:00:00Z",
            "end_time": "2026-12-05T17:00:00Z",
            "registration_deadline": "2026-12-04T23:59:59Z",
            "max_capacity": 60
        },
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    event_id = ev_res.json()["id"]

    # 2. Add feedback directly
    client.put(f"/api/v1/events/{event_id}/submit", headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"})
    admin_token = create_access_token({"sub": "admin-x", "email": "admin@ves.ac.in", "role": UserRole.ADMIN.value})
    client.put(f"/api/v1/events/{event_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})

    client.post(f"/api/v1/registrations/events/{event_id}", headers={"Authorization": f"Bearer {STUDENT_TOKEN}"})
    client.post(
        f"/api/v1/feedback/events/{event_id}",
        json={"rating": 5, "comments": "The PyTorch hands-on labs were clear and well explained."},
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )

    # 3. Summarize feedback with AI
    ai_summary = client.post(
        f"/api/v1/ai/summarize-feedback/{event_id}",
        headers={"Authorization": f"Bearer {FACULTY_TOKEN}"}
    )
    assert ai_summary.status_code == 200
    summary_data = ai_summary.json()
    assert summary_data["average_calculated_rating"] == 5.0
    assert summary_data["sentiment"] == "Positive"
    assert len(summary_data["key_positives"]) > 0
    assert len(summary_data["areas_for_improvement"]) > 0
