from typing import List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from app.core.security import decode_jwt_token
from app.models.schemas import UserPayload, UserRole

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Union[HTTPAuthorizationCredentials, None] = Depends(security_bearer)
) -> UserPayload:
    """
    Validates Supabase Bearer JWT and extracts the user identity and role.
    Raises 401 Unauthorized if the token is missing, invalid, or expired.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_jwt_token(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract role from claims (custom claims, app_metadata, user_metadata, or root claim)
    app_meta = payload.get("app_metadata", {})
    user_meta = payload.get("user_metadata", {})
    raw_role = payload.get("role") or app_meta.get("role") or user_meta.get("role") or "STUDENT"
    
    # Map into UserRole enum safely
    try:
        role = UserRole(str(raw_role).upper())
    except (ValueError, KeyError):
        role = UserRole.STUDENT

    full_name = user_meta.get("full_name") or user_meta.get("name") or payload.get("full_name")
    department = user_meta.get("department") or payload.get("department")

    return UserPayload(
        id=user_id,
        email=email or f"{user_id}@campus.edu",
        role=role,
        full_name=full_name,
        department=department,
    )


def require_role(allowed_roles: List[Union[UserRole, str]]):
    """
    Factory creating a dependency that enforces Role-Based Access Control (RBAC).
    Raises 403 Forbidden if the authenticated user does not have an approved role.
    """
    normalized_allowed = [
        r.value if isinstance(r, UserRole) else str(r).upper()
        for r in allowed_roles
    ]

    async def role_checker(
        current_user: UserPayload = Depends(get_current_user)
    ) -> UserPayload:
        if current_user.role.value not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Role '{current_user.role.value}' is not authorized. Allowed: {normalized_allowed}",
            )
        return current_user

    return role_checker
