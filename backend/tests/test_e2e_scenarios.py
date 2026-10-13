import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

from app.main import app
from app.core.security import create_access_token
from app.models.schemas import UserRole

client = TestClient(app)


def get_token(user_id: str, email: str, role: UserRole, name: str, dept: str = "Computer Science") -> str:
    return create_access_token({
        "sub": user_id,
        "email": email,
        "role": role.value,
        "user_metadata": {
            "full_name": name,
            "department": dept
        }
    })


def test_full_campus_event_lifecycle_e2e():
    """
    End-to-End Test exercising all 4 user personas across the entire lifecycle:
    1. Organizer: Uses AI Co-Pilot -> Creates event draft -> Submits draft for review
    2. Faculty: Reviews event -> Recommends approval
    3. Administrator: Checks venue -> Grants final approval
    4. Student: Browses catalog -> Registers for pass -> Receives HMAC QR ticket
    5. Gate Scanner: Organizer scans QR -> Validates check-in -> Rejects double-scan replay
    6. Post-Event: Student downloads PDF certificate -> Submits feedback
    7. Analytics & Reports: AI feedback summarizer -> CSV attendance report export
    """

    # Personas
    org_token = get_token("org-e2e-01", "organizer@ves.ac.in", UserRole.ORGANIZER, "Prof. Sharma (Organizer)")
    fac_token = get_token("fac-e2e-01", "faculty@ves.ac.in", UserRole.FACULTY, "Dr. Kulkarni (HOD)")
    adm_token = get_token("adm-e2e-01", "admin@ves.ac.in", UserRole.ADMIN, "Dean Patil (Admin)")
    stu_token = get_token("stu-e2e-01", "student@ves.ac.in", UserRole.STUDENT, "Aarav Mehta (Student)")

    org_headers = {"Authorization": f"Bearer {org_token}"}
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # -------------------------------------------------------------
    # Step 1: Organizer uses Mistral AI Co-Pilot to synthesize proposal
    # -------------------------------------------------------------
    ai_draft_resp = client.post(
        "/api/v1/ai/draft-event",
        headers=org_headers,
        json={
            "rough_prompt": "Organize a 24-hour National GenAI & Cloud Hackathon for engineering students with prizes and cloud credits.",
            "department": "Computer Science"
        }
    )
    assert ai_draft_resp.status_code == 200, ai_draft_resp.text
    ai_draft = ai_draft_resp.json()
    assert "title" in ai_draft
    assert "description" in ai_draft
    assert isinstance(ai_draft["tags"], list)

    # -------------------------------------------------------------
    # Step 2: Organizer creates and saves event draft
    # -------------------------------------------------------------
    now = datetime.now(timezone.utc)
    create_event_payload = {
        "title": ai_draft["title"],
        "description": ai_draft["description"],
        "department": "Computer Science",
        "venue_name": "Campus Main Auditorium",
        "start_time": (now + timedelta(days=5)).isoformat(),
        "end_time": (now + timedelta(days=6)).isoformat(),
        "registration_deadline": (now + timedelta(days=4)).isoformat(),
        "max_capacity": 50,
        "ai_generated_tags": ai_draft["tags"]
    }

    create_resp = client.post(
        "/api/v1/events",
        headers=org_headers,
        json=create_event_payload
    )
    assert create_resp.status_code == 201, create_resp.text
    event = create_resp.json()
    event_id = event["id"]
    assert event["status"] == "DRAFT"

    # Organizer submits event draft for faculty committee review
    submit_resp = client.put(f"/api/v1/events/{event_id}/submit", headers=org_headers)
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "SUBMITTED"

    # -------------------------------------------------------------
    # Step 3: Faculty reviews and recommends approval
    # -------------------------------------------------------------
    fac_rec_resp = client.put(f"/api/v1/events/{event_id}/recommend", headers=fac_headers)
    assert fac_rec_resp.status_code == 200
    assert fac_rec_resp.json()["status"] == "FACULTY_RECOMMENDED"

    # -------------------------------------------------------------
    # Step 4: Administrator inspects venue and grants final approval
    # -------------------------------------------------------------
    adm_app_resp = client.put(f"/api/v1/events/{event_id}/approve", headers=adm_headers)
    assert adm_app_resp.status_code == 200
    assert adm_app_resp.json()["status"] == "APPROVED"

    # -------------------------------------------------------------
    # Step 5: Student browses approved catalog and registers
    # -------------------------------------------------------------
    cat_resp = client.get("/api/v1/events", headers=stu_headers)
    assert cat_resp.status_code == 200
    events_list = cat_resp.json()
    assert any(e["id"] == event_id for e in events_list)

    # Student registers for event
    reg_resp = client.post(
        f"/api/v1/registrations/events/{event_id}",
        headers=stu_headers
    )
    assert reg_resp.status_code == 201, reg_resp.text
    registration = reg_resp.json()
    reg_id = registration["id"]
    assert registration["status"] == "CONFIRMED"
    ticket_qr_hash = registration["ticket_qr_hash"]
    assert ticket_qr_hash is not None
    assert "." in ticket_qr_hash

    # Student views pass in digital wallet
    my_passes_resp = client.get("/api/v1/registrations/me", headers=stu_headers)
    assert my_passes_resp.status_code == 200
    my_passes = my_passes_resp.json()
    assert any(p["id"] == reg_id for p in my_passes)

    # -------------------------------------------------------------
    # Step 6: Gate Check-In & Scanner verification
    # -------------------------------------------------------------
    # Organizer scans student's HMAC QR hash at venue entrance
    scan_resp = client.post(
        "/api/v1/attendance/scan",
        headers=org_headers,
        json={"ticket_qr_hash": ticket_qr_hash}
    )
    assert scan_resp.status_code == 200, scan_resp.text
    scan_data = scan_resp.json()
    assert scan_data["success"] is True
    assert scan_data["registration_id"] == reg_id

    # Replay Protection: Scanning the same QR code a second time must fail
    replay_resp = client.post(
        "/api/v1/attendance/scan",
        headers=org_headers,
        json={"ticket_qr_hash": ticket_qr_hash}
    )
    assert replay_resp.status_code == 400
    assert "already been redeemed" in replay_resp.json()["detail"].lower()

    # -------------------------------------------------------------
    # Step 7: Post-Event Completion: Certificate & Feedback
    # -------------------------------------------------------------
    # Student downloads official cryptographic PDF certificate
    cert_resp = client.get(f"/api/v1/certificates/{reg_id}", headers=stu_headers)
    assert cert_resp.status_code == 200
    assert cert_resp.headers["content-type"] == "application/pdf"
    assert cert_resp.content.startswith(b"%PDF-")

    # Student submits rating and feedback
    fb_resp = client.post(
        f"/api/v1/feedback/events/{event_id}",
        headers=stu_headers,
        json={
            "rating": 5,
            "comments": "Exceptional hands-on learning! The cloud infrastructure and AI challenges were incredible."
        }
    )
    assert fb_resp.status_code == 201

    # -------------------------------------------------------------
    # Step 8: AI Feedback Sentiment Analysis & CSV Export
    # -------------------------------------------------------------
    # Organizer / Faculty summarizes feedback with Mistral AI
    ai_summary_resp = client.post(f"/api/v1/ai/summarize-feedback/{event_id}", headers=fac_headers)
    assert ai_summary_resp.status_code == 200
    ai_summary = ai_summary_resp.json()
    assert "sentiment" in ai_summary
    assert "average_calculated_rating" in ai_summary
    assert "key_positives" in ai_summary

    # Organizer exports attendance CSV report
    csv_resp = client.get(f"/api/v1/reports/events/{event_id}/attendance/csv", headers=org_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Student Name,Student Email" in csv_resp.text


def test_ingress_and_cluster_health_endpoints():
    """Verify cluster readiness and ingress healthcheck probes."""
    # Liveness & Readiness probe
    healthz_resp = client.get("/healthz")
    assert healthz_resp.status_code == 200
    assert healthz_resp.json() == {"status": "ok"}

    # Root endpoint
    root_resp = client.get("/")
    assert root_resp.status_code == 200
    assert root_resp.json()["status"] == "online"
    assert "project" in root_resp.json()
