from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import require_role
from app.models.schemas import UserPayload, UserRole
from app.services.mistral_service import (
    EventDraftInput,
    EventDraftOutput,
    FeedbackSummaryOutput,
    mistral_service,
)
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/ai", tags=["AI Assistant (Mistral)"])


@router.post("/draft-event", response_model=EventDraftOutput)
async def draft_event_with_ai(
    draft_req: EventDraftInput,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Transforms rough organizer thoughts into structured event proposals using Mistral AI.
    Secured to Organizers and Administrators.
    """
    return await mistral_service.generate_event_draft(
        rough_prompt=draft_req.rough_prompt.strip(),
        department=draft_req.department.strip()
    )


@router.post("/summarize-feedback/{event_id}", response_model=FeedbackSummaryOutput)
async def summarize_event_feedback_with_ai(
    event_id: str,
    current_user: UserPayload = Depends(require_role([UserRole.ORGANIZER, UserRole.FACULTY, UserRole.ADMIN]))
):
    """
    Analyzes all attendee feedback ratings and textual reviews to generate executive takeaways.
    Secured to Organizers, Faculty, and Administrators.
    """
    event = await supabase_service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if current_user.role == UserRole.ORGANIZER and event.get("organizer_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizers can only summarize feedback for their own events"
        )

    feedbacks = await supabase_service.list_event_feedbacks(event_id)
    return await mistral_service.summarize_event_feedback(
        event_title=event.get("title", "Event"),
        feedbacks=feedbacks
    )

