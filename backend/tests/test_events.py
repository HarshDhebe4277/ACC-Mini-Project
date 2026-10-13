import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole, EventStatus

client = TestClient(app)

ORGANIZER_TOKEN = create_access_token({
    "sub": "org-uuid-1",
    "email": "organizer@ves.ac.in",
    "role": UserRole.ORGANIZER.value,
    "user_metadata": {"full_name": "Event Organizer", "department": "Computer Science"}
})

FACULTY_TOKEN = create_access_token({
    "sub": "fac-uuid-1",
    "email": "faculty@ves.ac.in",
    "role": UserRole.FACULTY.value,
    "user_metadata": {"full_name": "Faculty Advisor", "department": "Computer Science"}
})

FACULTY_OTHER_DEPT_TOKEN = create_access_token({
    "sub": "fac-uuid-2",
    "email": "faculty2@ves.ac.in",
    "role": UserRole.FACULTY.value,
    "user_metadata": {"full_name": "Other Dept Faculty", "department": "Civil Engineering"}
})

ADMIN_TOKEN = create_access_token({
    "sub": "admin-uuid-1",
    "email": "admin@ves.ac.in",
    "role": UserRole.ADMIN.value,
    "user_metadata": {"full_name": "Dean Admin"}
})

STUDENT_TOKEN = create_access_token({
    "sub": "student-uuid-3",
    "email": "student3@ves.ac.in",
    "role": UserRole.STUDENT.value
})


def test_event_full_approval_lifecycle():
    """Tests the full multi-stage event lifecycle: Draft -> Submit -> Recommend -> Approve."""
    event_payload = {
        "title": "National Hackathon 2026",
        "description": "36-hour coding extravaganza on Cloud, AI and Web3 technologies.",
        "department": "Computer Science",
        "start_time": "2026-11-15T09:00:00Z",
        "end_time": "2026-11-16T21:00:00Z",
        "registration_deadline": "2026-11-10T23:59:59Z",
        "max_capacity": 150,
        "ai_generated_tags": ["Hackathon", "AI", "Cloud", "FastAPI"]
    }

    # 1. Organizer creates draft
    res = client.post(
        "/api/v1/events",
        json=event_payload,
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert res.status_code == 201
    event = res.json()
    event_id = event["id"]
    assert event["status"] == EventStatus.DRAFT.value
    assert event["organizer_id"] == "org-uuid-1"

    # 2. Student cannot see unapproved event
    res_student = client.get(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert res_student.status_code == 403

    # 3. Organizer submits event for review
    res_submit = client.put(
        f"/api/v1/events/{event_id}/submit",
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert res_submit.status_code == 200
    assert res_submit.json()["status"] == EventStatus.SUBMITTED.value

    # 4. Faculty from another department cannot recommend
    res_fac_wrong = client.put(
        f"/api/v1/events/{event_id}/recommend",
        headers={"Authorization": f"Bearer {FACULTY_OTHER_DEPT_TOKEN}"}
    )
    assert res_fac_wrong.status_code == 403

    # 5. Faculty from matching department recommends event
    res_fac_ok = client.put(
        f"/api/v1/events/{event_id}/recommend",
        headers={"Authorization": f"Bearer {FACULTY_TOKEN}"}
    )
    assert res_fac_ok.status_code == 200
    assert res_fac_ok.json()["status"] == EventStatus.FACULTY_RECOMMENDED.value

    # 6. Admin gives final approval
    res_admin = client.put(
        f"/api/v1/events/{event_id}/approve",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["status"] == EventStatus.APPROVED.value

    # 7. Student can now see the approved event
    res_student_after = client.get(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert res_student_after.status_code == 200
    assert res_student_after.json()["id"] == event_id


def test_event_rejection_flow():
    """Tests rejecting an event proposal with a required reason."""
    event_payload = {
        "title": "Unapproved Rooftop Party",
        "description": "Party without safety checks or venue permissions.",
        "department": "Computer Science",
        "start_time": "2026-11-20T18:00:00Z",
        "end_time": "2026-11-20T23:00:00Z",
        "registration_deadline": "2026-11-19T23:59:59Z",
        "max_capacity": 50
    }

    # Create & submit
    res = client.post(
        "/api/v1/events",
        json=event_payload,
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    event_id = res.json()["id"]

    client.put(
        f"/api/v1/events/{event_id}/submit",
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )

    # Reject
    res_reject = client.put(
        f"/api/v1/events/{event_id}/reject",
        json={"rejection_reason": "Safety hazard and lack of department faculty supervision."},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
    )
    assert res_reject.status_code == 200
    rejected = res_reject.json()
    assert rejected["status"] == EventStatus.REJECTED.value
    assert rejected["rejection_reason"] == "Safety hazard and lack of department faculty supervision."
