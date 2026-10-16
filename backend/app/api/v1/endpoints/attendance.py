from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import require_role
from app.models.schemas import (
    AttendanceScanRequest,
    AttendanceScanResponse,
    AttendanceMethod,
    EventStatus,
    UserPayload,
    UserRole
)
from app.services.qr_service import qr_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/attendance", tags=["Attendance & Check-In"])


@router.post("/scan", response_model=AttendanceScanResponse)
async def scan_ticket_attendance(
    scan_req: AttendanceScanRequest,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Validate student digital ticket QR hash and mark attendance.
    Verifies HMAC-SHA256 signature, prevents duplicate check-ins, and enforces event authorization.
    """
    # 1. Cryptographically verify the QR hash
    try:
        payload = qr_service.verify_ticket_hash(scan_req.ticket_qr_hash)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or tampered ticket QR code: {str(e)}"
        )

    reg_id = payload["reg_id"]
    event_id = payload["event_id"]
    student_id = payload["user_id"]

    # 2. Check event existence and caller authorization
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event referenced by ticket not found")

    if current_user.role == UserRole.ORGANIZER:
        # Organizers can scan events they organized OR approved events at campus gates
        if event.get("status") != EventStatus.APPROVED.value and event.get("organizer_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only scan attendance for approved campus events or your own events"
            )

    # 3. Check registration validity
    reg = await supabase_service.get_registration(reg_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration record not found")

    # 4. Check for duplicate attendance redemption
    existing_att = await supabase_service.get_attendance_by_registration(reg_id)
    if existing_att:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ticket has already been redeemed at {existing_att.get('marked_at')}"
        )

    # 5. Record attendance
    record = await supabase_service.record_attendance(
        registration_id=reg_id,
        marked_by=current_user.id,
        method=AttendanceMethod.QR_SCAN.value
    )

    # 6. Create immutable audit trail
    venue_info = f" at {event.get('venue_name')}" if event.get("venue_name") else ""
    await supabase_service.create_audit_log(
        action="ATTENDANCE_SCANNED",
        target_resource="attendance",
        resource_id=reg_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_name=current_user.full_name or "Gate Scanner",
        actor_role=current_user.role.value,
        details=f"HMAC ticket verified & checked in{venue_info} for event '{event.get('title')}'."
    )

    student_profile = await supabase_service.get_profile(student_id)
    student_name = student_profile.get("full_name") if student_profile else f"Student ({student_id[:8]})"

    return AttendanceScanResponse(
        success=True,
        message="Attendance successfully verified and recorded",
        registration_id=reg_id,
        user_name=student_name,
        event_id=event_id,
        event_title=event.get("title"),
        marked_at=datetime.fromisoformat(record["marked_at"]),
        attendance_method=AttendanceMethod.QR_SCAN
    )

