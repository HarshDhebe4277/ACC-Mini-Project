from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.schemas import UserPayload

router = APIRouter(prefix="/auth", tags=["Authentication & User"])


@router.get("/me", response_model=UserPayload)
async def get_my_profile(current_user: UserPayload = Depends(get_current_user)):
    """Returns the authenticated user's identity, role, and department."""
    return current_user

