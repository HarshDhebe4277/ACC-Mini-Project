import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole

client = TestClient(app)

ORGANIZER_TOKEN = create_access_token({
    "sub": "org-rep-1",
    "email": "org_rep@ves.ac.in",
    "role": UserRole.ORGANIZER.value,
    "user_metadata": {"full_name": "Report Org"}
})

FACULTY_TOKEN = create_access_token({
    "sub": "fac-rep-1",
    "email": "fac_rep@ves.ac.in",
    "role": UserRole.FACULTY.value,
    "user_metadata": {"full_name": "Report Faculty", "department": "IT"}
})

STUDENT_TOKEN = create_access_token({
    "sub": "stud-rep-1",
    "email": "stud_rep@ves.ac.in",
    "role": UserRole.STUDENT.value,
    "user_metadata": {"full_name": "Report Student"}
})

ADMIN_TOKEN = create_access_token({
    "sub": "admin-rep-1",
    "email": "admin_rep@ves.ac.in",
    "role": UserRole.ADMIN.value
})


def test_reports_and_feedback():
    """Verify attendance reports (JSON/CSV) and post-event feedback submission."""
    # 1. Create & approve event
    res = client.post(
        "/api/v1/events",
        json={
            "title": "AI & Big Data Summit",
            "description": "Annual conference on artificial intelligence.",
            "department": "IT",
            "start_time": "2026-12-01T09:00:00Z",
            "end_time": "2026-12-01T17:00:00Z",
            "registration_deadline": "2026-11-30T23:59:59Z",
            "max_capacity": 100
        },
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    event_id = res.json()["id"]
    client.put(f"/api/v1/events/{event_id}/submit", headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"})
    client.put(f"/api/v1/events/{event_id}/approve", headers={"Authorization": f"Bearer {ADMIN_TOKEN}"})

    # 2. Student registers
    client.post(
        f"/api/v1/registrations/events/{event_id}",
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )

    # 3. View attendance report JSON
    rep_res = client.get(
        f"/api/v1/reports/events/{event_id}/attendance",
        headers={"Authorization": f"Bearer {FACULTY_TOKEN}"}
    )
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["event_id"] == event_id
    assert rep_data["total_registrations"] == 1

    # 4. Export attendance report CSV
    csv_res = client.get(
        f"/api/v1/reports/events/{event_id}/attendance/csv",
        headers={"Authorization": f"Bearer {FACULTY_TOKEN}"}
    )
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Student Name,Student Email" in csv_res.text

    # 5. Submit feedback
    fb_res = client.post(
        f"/api/v1/feedback/events/{event_id}",
        json={"rating": 5, "comments": "Outstanding keynote sessions!"},
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert fb_res.status_code == 201
    assert fb_res.json()["rating"] == 5

    # 6. Read feedback list
    fb_list = client.get(
        f"/api/v1/feedback/events/{event_id}",
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert fb_list.status_code == 200
    assert len(fb_list.json()) == 1
