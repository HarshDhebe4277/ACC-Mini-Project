import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user, require_role
from app.models.schemas import (
    RegistrationResponse,
    RegistrationStatus,
    EventStatus,
    UserPayload,
    UserRole
)
from app.services.qr_service import qr_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/registrations", tags=["Registrations & Passes"])


@router.post("/events/{event_id}", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.STUDENT, UserRole.ADMIN]))
):
    """
    Register authenticated student for an approved event.
    Generates HMAC SHA-256 digital ticket QR hash and checks capacity.
    """
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.get("status") != EventStatus.APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot register for an event that is not approved"
        )

    # Check if registration deadline has passed
    deadline_val = event.get("registration_deadline")
    if deadline_val:
        if isinstance(deadline_val, str):
            deadline = datetime.fromisoformat(deadline_val.replace("Z", "+00:00"))
        else:
            deadline = deadline_val
        
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > deadline:
            raise HTTPException(
                status_code=400,
                detail="Registration deadline for this event has passed"
            )

    # Check for duplicate registration
    existing = await supabase_service.get_registration_by_user_event(event_id, current_user.id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="User is already registered for this event"
        )

    # Atomic capacity check: determine if CONFIRMED or WAITLISTED
    max_cap = event.get("max_capacity", 0)
    current_cap = event.get("current_capacity", 0)
    reg_status = RegistrationStatus.CONFIRMED.value if current_cap < max_cap else RegistrationStatus.WAITLISTED.value

    # Generate HMAC-SHA256 cryptographic ticket hash
    reg_id = str(uuid.uuid4())
    ticket_qr_hash = qr_service.generate_ticket_hash(
        registration_id=reg_id,
        user_id=current_user.id,
        event_id=event_id
    )

    created_reg = await supabase_service.create_registration(
        event_id=event_id,
        user_id=current_user.id,
        ticket_qr_hash=ticket_qr_hash,
        status=reg_status,
        registration_id=reg_id
    )
    # Ensure ID matches
    created_reg["id"] = reg_id
    created_reg["ticket_qr_hash"] = ticket_qr_hash
    created_reg["event_title"] = event.get("title")
    created_reg["event_start_time"] = event.get("start_time")
    created_reg["user_name"] = current_user.full_name
    created_reg["user_email"] = current_user.email

    await supabase_service.create_audit_log(
        action="REGISTRATION_CONFIRMED" if reg_status == RegistrationStatus.CONFIRMED.value else "REGISTRATION_WAITLISTED",
        target_resource="registrations",
        resource_id=reg_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        details=f"Student registered for '{event.get('title')}' ({reg_status}). Generated cryptographic HMAC ticket pass."
    )

    return created_reg


@router.get("/me", response_model=List[RegistrationResponse])
async def get_my_passes(
    current_user: UserPayload = Depends(get_current_user)
):
    """Retrieve all event registration passes for the current user."""
    passes = await supabase_service.list_user_registrations(current_user.id)
    for p in passes:
        p["user_name"] = current_user.full_name
        p["user_email"] = current_user.email
    return passes
