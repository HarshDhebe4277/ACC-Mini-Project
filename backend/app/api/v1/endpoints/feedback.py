from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user, require_role
from app.models.schemas import (
    FeedbackCreate,
    FeedbackResponse,
    UserPayload,
    UserRole
)
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/feedback", tags=["Event Feedback"])


@router.post("/events/{event_id}", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    event_id: str,
    feedback_in: FeedbackCreate,
    current_user: UserPayload = Depends(require_role([UserRole.STUDENT, UserRole.ADMIN]))
):
    """Submit post-event feedback and rating (1-5 stars)."""
    # Verify registration
    reg = await supabase_service.get_registration_by_user_event(event_id, current_user.id)
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be registered for this event to leave feedback"
        )

    fb = await supabase_service.create_feedback(
        event_id=event_id,
        user_id=current_user.id,
        rating=feedback_in.rating,
        comments=feedback_in.comments
    )
    fb["user_name"] = current_user.full_name
    return fb


@router.get("/events/{event_id}", response_model=List[FeedbackResponse])
async def list_feedback_for_event(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.FACULTY, UserRole.ADMIN]))
):
    """Retrieve all feedbacks submitted for an event."""
    return await supabase_service.list_event_feedbacks(event_id)

