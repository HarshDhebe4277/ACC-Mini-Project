from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.dependencies import get_current_user, require_role
from app.models.schemas import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventRejectRequest,
    EventStatus,
    UserPayload,
    UserRole,
)
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """Create a new event draft (Organizer or Admin)."""
    event_dict = event_in.model_dump()
    event_dict["organizer_id"] = current_user.id
    event_dict["status"] = EventStatus.DRAFT.value
    event_dict["current_capacity"] = 0
    
    created = await supabase_service.create_event(event_dict)
    return created


@router.get("", response_model=List[EventResponse])
async def list_events(
    category_id: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[EventStatus] = Query(None, alias="status"),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    List events based on user role and query parameters:
    - Students see only APPROVED events.
    - Organizers see APPROVED events + their own events.
    - Faculty see APPROVED events + their department's events.
    - Admins see all events.
    """
    all_events = await supabase_service.list_events(
        category_id=category_id,
        department=department,
        status=status_filter.value if status_filter else None
    )

    filtered = []
    for ev in all_events:
        ev_status = ev.get("status")
        organizer_id = ev.get("organizer_id")
        ev_dept = ev.get("department")

        if current_user.role == UserRole.ADMIN:
            filtered.append(ev)
        elif current_user.role == UserRole.FACULTY:
            if ev_status == EventStatus.APPROVED.value or (current_user.department and ev_dept == current_user.department):
                filtered.append(ev)
        elif current_user.role == UserRole.ORGANIZER:
            if ev_status == EventStatus.APPROVED.value or organizer_id == current_user.id:
                filtered.append(ev)
        else: # STUDENT
            if ev_status == EventStatus.APPROVED.value:
                filtered.append(ev)

    return filtered


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Retrieve detailed event information by ID."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID '{event_id}' not found"
        )

    # Permission check for viewing non-approved events
    ev_status = event.get("status")
    if ev_status != EventStatus.APPROVED.value:
        if current_user.role == UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view approved events"
            )
        if current_user.role == UserRole.ORGANIZER and event.get("organizer_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organizers can only view their own draft/unapproved events"
            )

    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """Update event details. Only allowed in DRAFT or REJECTED status unless Admin."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role == UserRole.ORGANIZER:
        if event.get("organizer_id") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only edit events you organized")
        if event.get("status") not in [EventStatus.DRAFT.value, EventStatus.REJECTED.value]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot edit event in '{event.get('status')}' status. Only DRAFT or REJECTED events can be modified."
            )

    updates = {k: v for k, v in event_in.model_dump().items() if v is not None}
    updated = await supabase_service.update_event(event_id, updates)
    return updated


@router.put("/{event_id}/submit", response_model=EventResponse)
async def submit_event_for_approval(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """Transition event status from DRAFT or REJECTED to SUBMITTED."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role == UserRole.ORGANIZER and event.get("organizer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="You can only submit your own events")

    if event.get("status") not in [EventStatus.DRAFT.value, EventStatus.REJECTED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit event in '{event.get('status')}' status"
        )

    updated = await supabase_service.update_event(event_id, {
        "status": EventStatus.SUBMITTED.value,
        "rejection_reason": None
    })
    return updated


@router.put("/{event_id}/recommend", response_model=EventResponse)
async def recommend_event_approval(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN]))
):
    """Transition event status from SUBMITTED to FACULTY_RECOMMENDED (Faculty review)."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.get("status") != EventStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Event must be in SUBMITTED status to be recommended. Current: '{event.get('status')}'"
        )

    if current_user.role == UserRole.FACULTY:
        if current_user.department and event.get("department") != current_user.department:
            raise HTTPException(
                status_code=403,
                detail=f"Faculty can only review events within their department ('{current_user.department}')"
            )

    updated = await supabase_service.update_event(event_id, {
        "status": EventStatus.FACULTY_RECOMMENDED.value
    })
    return updated


@router.put("/{event_id}/approve", response_model=EventResponse)
async def approve_event(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.ADMIN]))
):
    """Final approval by Admin to publish the event to the campus schedule."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.get("status") not in [EventStatus.SUBMITTED.value, EventStatus.FACULTY_RECOMMENDED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Event must be SUBMITTED or FACULTY_RECOMMENDED to approve. Current: '{event.get('status')}'"
        )

    updated = await supabase_service.update_event(event_id, {
        "status": EventStatus.APPROVED.value,
        "rejection_reason": None
    })
    return updated


@router.put("/{event_id}/reject", response_model=EventResponse)
async def reject_event(
    event_id: str,
    rejection: EventRejectRequest,
    current_user: UserPayload = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN]))
):
    """Reject event proposal with a mandatory explanation reason."""
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role == UserRole.FACULTY:
        if current_user.department and event.get("department") != current_user.department:
            raise HTTPException(
                status_code=403,
                detail="Faculty can only reject events in their own department"
            )

    updated = await supabase_service.update_event(event_id, {
        "status": EventStatus.REJECTED.value,
        "rejection_reason": rejection.rejection_reason
    })
    return updated
