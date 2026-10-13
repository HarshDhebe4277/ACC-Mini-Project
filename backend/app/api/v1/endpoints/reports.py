import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.core.dependencies import require_role
from app.models.schemas import (
    EventAttendanceReport,
    AttendanceReportItem,
    RegistrationStatus,
    UserPayload,
    UserRole
)
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/events/{event_id}/attendance", response_model=EventAttendanceReport)
async def get_event_attendance_report(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Retrieve detailed attendance breakdown report for an event."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role == UserRole.ORGANIZER and event.get("organizer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view reports for your own events")

    attendees_data = await supabase_service.list_event_attendees(event_id)
    total_reg = len(attendees_data)
    total_att = sum(1 for a in attendees_data if a["attended"])
    rate = round((total_att / total_reg * 100), 2) if total_reg > 0 else 0.0

    items = [
        AttendanceReportItem(
            student_name=f"Student {a['user_id'][:6]}",
            student_email=f"user_{a['user_id'][:6]}@ves.ac.in",
            department=event.get("department"),
            status=RegistrationStatus(a["status"]),
            attended=a["attended"],
            marked_at=a["marked_at"]
        )
        for a in attendees_data
    ]

    return EventAttendanceReport(
        event_id=event_id,
        event_title=event.get("title", ""),
        department=event.get("department", ""),
        total_registrations=total_reg,
        total_attended=total_att,
        attendance_rate_percent=rate,
        attendees=items
    )


@router.get("/events/{event_id}/attendance/csv")
async def export_attendance_csv(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN, UserRole.ORGANIZER]))
):
    """Export attendance data as a downloadable CSV file."""
    report = await get_event_attendance_report(event_id, current_user)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "Student Email", "Department", "Registration Status", "Attended", "Checked In At"])
    
    for item in report.attendees:
        writer.writerow([
            item.student_name,
            item.student_email,
            item.department or "",
            item.status.value,
            "YES" if item.attended else "NO",
            item.marked_at or "N/A"
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Attendance_{report.event_title[:15].replace(' ', '_')}.csv"}
    )
