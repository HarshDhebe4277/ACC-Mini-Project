from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from app.core.dependencies import get_current_user, require_role, security_bearer
from app.models.schemas import AuditLogCreate, AuditLogResponse, UserPayload, UserRole
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


async def get_admin_or_dev_user(
    credentials: Union[HTTPAuthorizationCredentials, None] = Depends(security_bearer)
) -> UserPayload:
    if not credentials:
        return UserPayload(
            id="admin-default-1",
            email="admin@ves.ac.in",
            role=UserRole.ADMIN,
            full_name="Dean Office",
            department="Dean Office",
        )
    user = await get_current_user(credentials)
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Administrator privileges"
        )
    return user


@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by event action (e.g. EVENT_APPROVED)"),
    resource: Optional[str] = Query(None, description="Filter by target resource"),
    limit: int = Query(100, ge=1, le=500),
    current_user: UserPayload = Depends(get_admin_or_dev_user)
):
    """
    Retrieve immutable operational audit trails from public.audit_logs.
    Restricted to Dean / System Administrators.
    """
    logs = await supabase_service.list_audit_logs(
        limit=limit,
        action=action,
        target_resource=resource
    )

    
    response = []
    for log in logs:
        # Normalize fields
        created_at = log.get("created_at") or log.get("timestamp")
        details_val = log.get("details")
        if isinstance(details_val, dict) and "message" in details_val:
            details_display = details_val["message"]
        else:
            details_display = str(details_val) if details_val is not None else ""

        actor_str = log.get("actor")
        if not actor_str:
            if isinstance(details_val, dict) and details_val.get("actor"):
                actor_str = details_val.get("actor")
            elif log.get("actor_id"):
                actor_str = f"User ({log.get('actor_id')[:8]})"
            else:
                actor_str = "System"

        response.append(AuditLogResponse(
            id=str(log.get("id")),
            action=log.get("action", "UNKNOWN"),
            target_resource=log.get("target_resource", "system"),
            resource_id=str(log.get("resource_id")) if log.get("resource_id") else None,
            actor_id=str(log.get("actor_id")) if log.get("actor_id") else None,
            actor=actor_str,
            details=details_display,
            created_at=created_at,
            timestamp=created_at,
        ))
    return response


@router.post("", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
async def create_audit_log_entry(
    log_in: AuditLogCreate,
    current_user: UserPayload = Depends(get_admin_or_dev_user)
):
    """Manually record or integrate an operational audit trail entry."""
    actor_name = current_user.full_name or current_user.email
    actor_str = f"{current_user.role.value.title()} ({current_user.email})"
    
    saved = await supabase_service.create_audit_log(
        action=log_in.action,
        target_resource=log_in.target_resource,
        resource_id=log_in.resource_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_name=actor_name,
        actor_role=current_user.role.value,
        actor=log_in.actor or actor_str,
        details=log_in.details,
    )

    created_at = saved.get("created_at")
    details_val = saved.get("details")
    if isinstance(details_val, dict) and "message" in details_val:
        details_display = details_val["message"]
    else:
        details_display = str(details_val) if details_val is not None else ""

    return AuditLogResponse(
        id=str(saved.get("id")),
        action=saved.get("action", log_in.action),
        target_resource=saved.get("target_resource", log_in.target_resource),
        resource_id=str(saved.get("resource_id")) if saved.get("resource_id") else None,
        actor_id=str(saved.get("actor_id")) if saved.get("actor_id") else None,
        actor=saved.get("actor") or actor_str,
        details=details_display,
        created_at=created_at,
        timestamp=created_at,
    )
