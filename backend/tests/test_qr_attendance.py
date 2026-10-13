import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole, EventStatus

client = TestClient(app)

ORGANIZER_TOKEN = create_access_token({
    "sub": "org-uuid-99",
    "email": "org99@ves.ac.in",
    "role": UserRole.ORGANIZER.value,
    "user_metadata": {"full_name": "Lead Organizer", "department": "IT"}
})

ADMIN_TOKEN = create_access_token({
    "sub": "admin-uuid-99",
    "email": "admin99@ves.ac.in",
    "role": UserRole.ADMIN.value
})

STUDENT_TOKEN = create_access_token({
    "sub": "student-uuid-99",
    "email": "student99@ves.ac.in",
    "role": UserRole.STUDENT.value,
    "user_metadata": {"full_name": "Aarav Sharma", "department": "IT"}
})


def test_registration_qr_attendance_and_certificate_flow():
    """
    End-to-end integration test:
    1. Create and approve event
    2. Student registers and obtains HMAC-SHA256 QR ticket hash
    3. Tampered ticket verification fails with 400
    4. Organizer scans ticket and marks attendance
    5. Duplicate scan on same ticket fails with 400
    6. Student downloads valid PDF certificate
    """
    # 1. Create and approve event
    res = client.post(
        "/api/v1/events",
        json={
            "title": "Cloud Native Kubernetes Workshop",
            "description": "Comprehensive workshop on GKE, Helm, and CI/CD pipelines.",
            "department": "IT",
            "start_time": "2026-11-25T10:00:00Z",
            "end_time": "2026-11-25T16:00:00Z",
            "registration_deadline": "2026-11-24T23:59:59Z",
            "max_capacity": 50
        },
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    event_id = res.json()["id"]

    # Submit and approve
    client.put(f"/api/v1/events/{event_id}/submit", headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"})
    client.put(f"/api/v1/events/{event_id}/approve", headers={"Authorization": f"Bearer {ADMIN_TOKEN}"})

    # 2. Student registers
    reg_res = client.post(
        f"/api/v1/registrations/events/{event_id}",
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    reg_id = reg_data["id"]
    qr_hash = reg_data["ticket_qr_hash"]
    assert "." in qr_hash

    # 3. Tampered token fails
    tampered_hash = qr_hash[:-4] + "ffff"
    scan_fail = client.post(
        "/api/v1/attendance/scan",
        json={"ticket_qr_hash": tampered_hash},
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert scan_fail.status_code == 400
    assert "Invalid or tampered ticket QR code" in scan_fail.json()["detail"]

    # 4. Valid QR scan by organizer succeeds
    scan_ok = client.post(
        "/api/v1/attendance/scan",
        json={"ticket_qr_hash": qr_hash},
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert scan_ok.status_code == 200
    scan_res = scan_ok.json()
    assert scan_res["success"] is True
    assert scan_res["registration_id"] == reg_id

    # 5. Duplicate scan fails
    scan_dup = client.post(
        "/api/v1/attendance/scan",
        json={"ticket_qr_hash": qr_hash},
        headers={"Authorization": f"Bearer {ORGANIZER_TOKEN}"}
    )
    assert scan_dup.status_code == 400
    assert "already been redeemed" in scan_dup.json()["detail"]

    # 6. Student downloads certificate PDF
    cert_res = client.get(
        f"/api/v1/certificates/{reg_id}",
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    assert cert_res.status_code == 200
    assert cert_res.headers["content-type"] == "application/pdf"
    assert len(cert_res.content) > 1000
    assert cert_res.content[:4] == b"%PDF"
