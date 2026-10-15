from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import require_role
from app.models.schemas import UserPayload, UserRole, UserRoleUpdate, UserProfile
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/users", tags=["User & RBAC Management"])


@router.get("", response_model=List[UserProfile])
async def list_users(
    current_user: UserPayload = Depends(require_role([UserRole.ADMIN]))
):
    """List all campus user profiles (Admin only)."""
    profiles = await supabase_service.list_profiles()
    res = []
    for p in profiles:
        res.append(UserProfile(
            id=p.get("id"),
            email=p.get("email", ""),
            full_name=p.get("full_name") or p.get("name", "User"),
            department=p.get("department"),
            role=p.get("role", UserRole.STUDENT),
            is_active=p.get("is_active", True),
            created_at=p.get("created_at"),
            updated_at=p.get("updated_at"),
        ))
    return res


@router.put("/{user_id}/role", response_model=UserProfile)
async def update_user_role(
    user_id: str,
    role_in: UserRoleUpdate,
    current_user: UserPayload = Depends(require_role([UserRole.ADMIN]))
):
    """
    Elevate or modify user persona (Student, Organizer, Faculty, Admin).
    Logs an immutable ROLE_ELEVATED audit event to public.audit_logs.
    """
    old_profile = await supabase_service.get_profile(user_id)
    old_role = old_profile.get("role", "STUDENT") if old_profile else "UNKNOWN"
    
    updated = await supabase_service.update_profile_role(user_id, role_in.role.value)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found"
        )

    target_email = updated.get("email") or f"user-{user_id[:8]}@ves.ac.in"
    target_name = updated.get("full_name") or f"User ({user_id[:8]})"

    await supabase_service.create_audit_log(
        action="ROLE_ELEVATED",
        target_resource="profiles",
        resource_id=user_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_name=current_user.full_name,
        actor_role=current_user.role.value,
        details=f"User {target_name} ({target_email}) role transitioned from {old_role} to {role_in.role.value}."
    )

    return UserProfile(
        id=updated.get("id"),
        email=updated.get("email", target_email),
        full_name=updated.get("full_name", target_name),
        department=updated.get("department"),
        role=updated.get("role", role_in.role.value),
        is_active=updated.get("is_active", True),
        created_at=updated.get("created_at"),
        updated_at=updated.get("updated_at"),
    )
