from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.core.dependencies import get_current_user
from app.models.schemas import UserPayload, UserRole
from app.services.pdf_service import pdf_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/{registration_id}")
async def download_certificate(
    registration_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Download a dynamic PDF Certificate of Participation.
    Requires confirmed attendance for the event registration.
    """
    reg = await supabase_service.get_registration(registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Only student themselves or admin/faculty can download
    if current_user.role == UserRole.STUDENT and reg.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="You can only download your own certificates")

    # Check that attendance has been confirmed
    att = await supabase_service.get_attendance_by_registration(registration_id)
    if not att:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate unavailable: Attendance has not been verified for this registration"
        )

    event = await supabase_service.get_event(reg.get("event_id"))
    event_title = event.get("title") if event else "Campus Event"
    department = event.get("department") if event else "Campus Committee"
    
    date_str = att.get("marked_at", datetime.now().isoformat())[:10]
    student_name = current_user.full_name or f"Student ({current_user.email.split('@')[0]})"

    pdf_bytes = pdf_service.generate_certificate_pdf(
        student_name=student_name,
        event_title=event_title,
        completion_date=date_str,
        certificate_id=registration_id,
        department=department
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Certificate_{event_title[:15].replace(' ', '_')}.pdf"
        }
    )

