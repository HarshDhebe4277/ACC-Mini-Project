import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from app.core.config import settings


class QRService:
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = (secret_key or settings.QR_HMAC_SECRET).encode("utf-8")

    def generate_ticket_hash(
        self,
        registration_id: str,
        user_id: str,
        event_id: str
    ) -> str:
        """
        Creates a tamper-proof cryptographic HMAC-SHA256 signature token
        encoding the registration ID, user ID, event ID, and timestamp.
        """
        payload = {
            "reg_id": registration_id,
            "user_id": user_id,
            "event_id": event_id,
            "iat": int(time.time())
        }
        json_bytes = json.dumps(payload, separators=(',', ':'), sort_keys=True).encode("utf-8")
        b64_payload = base64.urlsafe_b64encode(json_bytes).decode("utf-8").rstrip("=")

        signature = hmac.new(
            self.secret_key,
            b64_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return f"{b64_payload}.{signature}"

    def verify_ticket_hash(self, token: str) -> Dict[str, Any]:
        """
        Verifies the cryptographic signature of the ticket QR hash and returns payload data.
        Raises ValueError if invalid, malformed, or tampered.
        """
        if not token or "." not in token:
            raise ValueError("Malformed ticket token format")

        parts = token.split(".")
        if len(parts) != 2:
            raise ValueError("Invalid ticket token structure")

        b64_payload, signature = parts[0], parts[1]

        # Re-compute expected HMAC
        expected_sig = hmac.new(
            self.secret_key,
            b64_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison
        if not hmac.compare_digest(expected_sig, signature):
            raise ValueError("Cryptographic signature mismatch: ticket has been forged or tampered with")

        # Decode base64 payload
        padding = "=" * (-len(b64_payload) % 4)
        try:
            raw_json = base64.urlsafe_b64decode(b64_payload + padding).decode("utf-8")
            payload = json.loads(raw_json)
        except Exception as e:
            raise ValueError(f"Failed to parse ticket payload: {str(e)}")

        for required in ["reg_id", "user_id", "event_id"]:
            if required not in payload:
                raise ValueError(f"Missing required ticket attribute '{required}'")

        return payload


qr_service = QRService()

