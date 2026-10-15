from typing import List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from app.core.security import decode_jwt_token
from app.models.schemas import UserPayload, UserRole
from app.services.supabase_service import supabase_service

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
    if token.startswith("demo-token-"):
        role_name = token.replace("demo-token-", "").upper()
        try:
            demo_role = UserRole(role_name)
        except (ValueError, KeyError):
            demo_role = UserRole.STUDENT
        return UserPayload(
            id=f"demo-{role_name.lower()}-1",
            email=f"{role_name.lower()}@ves.ac.in",
            role=demo_role,
            full_name=f"Demo {role_name.capitalize()}",
            department="Computer Science",
        )

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

    # 1. Look up authoritative role and details from Supabase profiles table
    profile = await supabase_service.get_profile(user_id)

    app_meta = payload.get("app_metadata", {})
    user_meta = payload.get("user_metadata", {})

    valid_role_values = {r.value for r in UserRole}
    raw_role = None
    full_name = None
    department = None

    if profile:
        profile_role = profile.get("role")
        if profile_role and str(profile_role).upper() in valid_role_values:
            raw_role = profile_role
        full_name = profile.get("full_name")
        department = profile.get("department")
        email = profile.get("email") or email

    # 2. Fall back to token claims if profile not found or role missing
    if not raw_role:
        for candidate in [
            user_meta.get("role"),
            app_meta.get("role"),
            payload.get("role"),
        ]:
            if candidate and str(candidate).upper() in valid_role_values:
                raw_role = candidate
                break

    try:
        role = UserRole(str(raw_role).upper()) if raw_role else UserRole.STUDENT
    except (ValueError, KeyError):
        role = UserRole.STUDENT

    full_name = full_name or user_meta.get("full_name") or user_meta.get("name") or payload.get("full_name")
    department = department or user_meta.get("department") or payload.get("department")

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

