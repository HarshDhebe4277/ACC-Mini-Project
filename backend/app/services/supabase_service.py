import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from app.core.config import settings
from app.models.schemas import EventStatus, RegistrationStatus, AttendanceMethod


class SupabaseService:
    def __init__(self):
        self._client: Optional[Client] = None
        self._is_mock = False
        
        # In-memory mock storage for local testing and isolated CI runs
        self._mock_events: Dict[str, Dict[str, Any]] = {}
        self._mock_registrations: Dict[str, Dict[str, Any]] = {}
        self._mock_attendance: Dict[str, Dict[str, Any]] = {}
        self._mock_feedbacks: Dict[str, Dict[str, Any]] = {}
        self._mock_profiles: Dict[str, Dict[str, Any]] = {}

        if (
            not settings.SUPABASE_URL
            or "example.supabase.co" in settings.SUPABASE_URL
            or "test-project.supabase.co" in settings.SUPABASE_URL
            or not settings.SUPABASE_SERVICE_ROLE_KEY
            or "default" in settings.SUPABASE_SERVICE_ROLE_KEY
            or "test-" in settings.SUPABASE_SERVICE_ROLE_KEY
        ):
            self._is_mock = True
        else:
            try:
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            except Exception:
                self._is_mock = True

    @property
    def is_mock(self) -> bool:
        return self._is_mock

    # =========================================================================
    # Events Management
    # =========================================================================

    async def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        event_id = event_data.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        record = {
            **event_data,
            "id": event_id,
            "current_capacity": event_data.get("current_capacity", 0),
            "status": event_data.get("status", EventStatus.DRAFT.value),
            "created_at": now,
            "updated_at": now,
        }

        if self._is_mock:
            self._mock_events[event_id] = record
            return record

        res = self._client.table("events").insert(record).execute()
        return res.data[0] if res.data else record

    async def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        if self._is_mock:
            return self._mock_events.get(event_id)

        res = self._client.table("events").select("*").eq("id", event_id).execute()
        return res.data[0] if res.data else None

    async def list_events(
        self,
        category_id: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self._is_mock:
            results = list(self._mock_events.values())
            if category_id:
                results = [e for e in results if e.get("category_id") == category_id]
            if department:
                results = [e for e in results if e.get("department") == department]
            if status:
                results = [e for e in results if e.get("status") == status]
            return results

        query = self._client.table("events").select("*")
        if category_id:
            query = query.eq("category_id", category_id)
        if department:
            query = query.eq("department", department)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        return res.data or []

    async def update_event(self, event_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self._is_mock:
            event = self._mock_events.get(event_id)
            if not event:
                return None
            event.update(updates)
            return event

        res = self._client.table("events").update(updates).eq("id", event_id).execute()
        return res.data[0] if res.data else None

    # =========================================================================
    # Registrations Management
    # =========================================================================

    async def create_registration(
        self,
        event_id: str,
        user_id: str,
        ticket_qr_hash: str,
        status: str = RegistrationStatus.CONFIRMED.value,
        registration_id: Optional[str] = None
    ) -> Dict[str, Any]:
        reg_id = registration_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": reg_id,
            "event_id": event_id,
            "user_id": user_id,
            "ticket_qr_hash": ticket_qr_hash,
            "status": status,
            "created_at": now
        }

        if self._is_mock:
            self._mock_registrations[reg_id] = record
            # Increment event current_capacity if confirmed
            if status == RegistrationStatus.CONFIRMED.value and event_id in self._mock_events:
                self._mock_events[event_id]["current_capacity"] += 1
            return record

        res = self._client.table("registrations").insert(record).execute()
        # Increment capacity on database if confirmed
        if status == RegistrationStatus.CONFIRMED.value:
            self._client.rpc("increment_event_capacity", {"e_id": event_id}).execute()
        return res.data[0] if res.data else record

    async def get_registration(self, reg_id: str) -> Optional[Dict[str, Any]]:
        if self._is_mock:
            return self._mock_registrations.get(reg_id)

        res = self._client.table("registrations").select("*").eq("id", reg_id).execute()
        return res.data[0] if res.data else None

    async def get_registration_by_user_event(
        self,
        event_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        if self._is_mock:
            for r in self._mock_registrations.values():
                if r["event_id"] == event_id and r["user_id"] == user_id:
                    return r
            return None

        res = self._client.table("registrations").select("*").eq("event_id", event_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    async def list_user_registrations(self, user_id: str) -> List[Dict[str, Any]]:
        if self._is_mock:
            regs = [r for r in self._mock_registrations.values() if r["user_id"] == user_id]
            for r in regs:
                event = self._mock_events.get(r["event_id"])
                if event:
                    r["event_title"] = event.get("title")
                    r["event_start_time"] = event.get("start_time")
            return regs

        res = self._client.table("registrations").select("*, events(title, start_time, venue_id)").eq("user_id", user_id).execute()
        return res.data or []

    # =========================================================================
    # Attendance Management
    # =========================================================================

    async def get_attendance_by_registration(self, registration_id: str) -> Optional[Dict[str, Any]]:
        if self._is_mock:
            for a in self._mock_attendance.values():
                if a["registration_id"] == registration_id:
                    return a
            return None

        res = self._client.table("attendance").select("*").eq("registration_id", registration_id).execute()
        return res.data[0] if res.data else None

    async def record_attendance(
        self,
        registration_id: str,
        marked_by: str,
        method: str = AttendanceMethod.QR_SCAN.value
    ) -> Dict[str, Any]:
        att_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": att_id,
            "registration_id": registration_id,
            "marked_by": marked_by,
            "marked_at": now,
            "attendance_method": method
        }

        if self._is_mock:
            self._mock_attendance[att_id] = record
            if registration_id in self._mock_registrations:
                self._mock_registrations[registration_id]["status"] = RegistrationStatus.ATTENDED.value
            return record

        res = self._client.table("attendance").insert(record).execute()
        self._client.table("registrations").update({"status": RegistrationStatus.ATTENDED.value}).eq("id", registration_id).execute()
        return res.data[0] if res.data else record

    async def list_event_attendees(self, event_id: str) -> List[Dict[str, Any]]:
        if self._is_mock:
            regs = [r for r in self._mock_registrations.values() if r["event_id"] == event_id]
            attendee_list = []
            for r in regs:
                att = next((a for a in self._mock_attendance.values() if a["registration_id"] == r["id"]), None)
                attendee_list.append({
                    "registration_id": r["id"],
                    "user_id": r["user_id"],
                    "status": r["status"],
                    "attended": att is not None,
                    "marked_at": att["marked_at"] if att else None
                })
            return attendee_list

        res = self._client.table("registrations").select("id, user_id, status, attendance(id, marked_at)").eq("event_id", event_id).execute()
        return res.data or []

    # =========================================================================
    # Feedbacks
    # =========================================================================

    async def create_feedback(
        self,
        event_id: str,
        user_id: str,
        rating: int,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        fb_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": fb_id,
            "event_id": event_id,
            "user_id": user_id,
            "rating": rating,
            "comments": comments,
            "created_at": now
        }

        if self._is_mock:
            self._mock_feedbacks[fb_id] = record
            return record

        res = self._client.table("feedbacks").insert(record).execute()
        return res.data[0] if res.data else record

    async def list_event_feedbacks(self, event_id: str) -> List[Dict[str, Any]]:
        if self._is_mock:
            return [f for f in self._mock_feedbacks.values() if f["event_id"] == event_id]

        res = self._client.table("feedbacks").select("*").eq("event_id", event_id).execute()
        return res.data or []


supabase_service = SupabaseService()
