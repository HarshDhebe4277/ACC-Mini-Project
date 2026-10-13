from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Helper to generate JWT tokens, primarily used for testing and simulations."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm=ALGORITHM)


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and cryptographically verifies a Supabase JWT token.
    Raises JWTError if invalid or expired.
    """
    return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=[ALGORITHM],
        options={"verify_aud": False}
    )

