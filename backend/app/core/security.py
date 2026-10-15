import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import httpx
from jose import JWTError, jwt, jwk
from app.core.config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
SUPPORTED_ALGORITHMS = ["HS256", "ES256", "RS256"]

# In-memory cache for Supabase JWKS keys: kid / alg -> key object or PEM
_JWKS_CACHE: Dict[str, Any] = {}


def get_jwks_key(kid: Optional[str] = None, alg: Optional[str] = None) -> Optional[Any]:
    """
    Fetches and caches the public JWKS keys from Supabase Auth endpoint.
    """
    global _JWKS_CACHE
    if kid and kid in _JWKS_CACHE:
        return _JWKS_CACHE[kid]

    try:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        resp = httpx.get(jwks_url, timeout=5.0)
        if resp.status_code == 200:
            jwks = resp.json()
            for key_dict in jwks.get("keys", []):
                k_id = key_dict.get("kid")
                k_alg = key_dict.get("alg")
                try:
                    constructed_key = jwk.construct(key_dict)
                    key_val = constructed_key.to_pem()
                except Exception:
                    key_val = key_dict

                if k_id:
                    _JWKS_CACHE[k_id] = key_val
                if k_alg and k_alg not in _JWKS_CACHE:
                    _JWKS_CACHE[k_alg] = key_val
    except Exception as e:
        logger.warning(f"Could not fetch Supabase JWKS: {e}")

    if kid and kid in _JWKS_CACHE:
        return _JWKS_CACHE[kid]
    if alg and alg in _JWKS_CACHE:
        return _JWKS_CACHE[alg]
    if _JWKS_CACHE:
        return next(iter(_JWKS_CACHE.values()))
    return None


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
    Supports symmetric HS256 and asymmetric ES256/RS256 Supabase tokens.
    Raises JWTError if invalid or expired.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        raise JWTError(f"Malformed token header: {str(e)}")

    alg = unverified_header.get("alg", "HS256")
    kid = unverified_header.get("kid")

    if alg not in SUPPORTED_ALGORITHMS:
        raise JWTError(f"The specified alg value is not allowed: {alg}")

    # Case 1: HS256 (local tokens / test suites)
    if alg == "HS256":
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )

    # Case 2: Asymmetric ES256 / RS256 token verified via JWKS
    key = get_jwks_key(kid=kid, alg=alg)
    if key:
        try:
            return jwt.decode(
                token,
                key,
                algorithms=SUPPORTED_ALGORITHMS,
                options={"verify_aud": False}
            )
        except JWTError:
            raise

    # Case 3: Fallback via Supabase Client Auth API
    try:
        from app.services.supabase_service import supabase_service
        if supabase_service._client:
            claims_res = supabase_service._client.auth.get_claims(token)
            if claims_res and claims_res.claims:
                return claims_res.claims
            user_res = supabase_service._client.auth.get_user(token)
            if user_res and user_res.user:
                u = user_res.user
                return {
                    "sub": u.id,
                    "email": u.email,
                    "role": u.role,
                    "app_metadata": u.app_metadata or {},
                    "user_metadata": u.user_metadata or {},
                }
    except Exception as e:
        logger.warning(f"Supabase auth API validation fallback failed: {e}")

    # Case 4: Development offline fallback (enforcing expiration)
    if settings.APP_ENV == "development":
        try:
            unverified_claims = jwt.get_unverified_claims(token)
            exp = unverified_claims.get("exp")
            if exp and datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
                raise JWTError("Token has expired")
            return unverified_claims
        except JWTError:
            raise
        except Exception:
            pass

    raise JWTError("Could not verify token signature with available public keys")
