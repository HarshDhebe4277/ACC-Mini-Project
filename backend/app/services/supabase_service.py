import uuid
from datetime import datetime, date, timezone, timedelta
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from app.core.config import settings
from app.models.schemas import EventStatus, RegistrationStatus, AttendanceMethod


def is_valid_uuid(val: Any) -> bool:
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


def serialize_record(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: serialize_record(v) for k, v in data.items() if v is not None}
    elif isinstance(data, list):
        return [serialize_record(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, uuid.UUID):
        return str(data)
    elif hasattr(data, "value"):
        return data.value
    return data


class SupabaseService:
    def __init__(self):
        self._client: Optional[Client] = None
        self._is_mock = False
        
        # In-memory mock storage for local testing and isolated CI runs
        self._mock_events: Dict[str, Dict[str, Any]] = {}
        self._mock_registrations: Dict[str, Dict[str, Any]] = {}
        self._mock_attendance: Dict[str, Dict[str, Any]] = {}
        self._mock_feedbacks: Dict[str, Dict[str, Any]] = {}
        now = datetime.now(timezone.utc)
        self._mock_profiles: Dict[str, Dict[str, Any]] = {
            "u-1": {
                "id": "u-1",
                "email": "aarav.sharma@ves.ac.in",
                "full_name": "Aarav Sharma",
                "department": "Information Technology",
                "role": "STUDENT",
                "is_active": True,
            },
            "u-2": {
                "id": "u-2",
                "email": "rohan.mehta@ves.ac.in",
                "full_name": "Rohan Mehta",
                "department": "Computer Science",
                "role": "ORGANIZER",
                "is_active": True,
            },
            "u-3": {
                "id": "u-3",
                "email": "sunita.rao@ves.ac.in",
                "full_name": "Dr. Sunita Rao",
                "department": "Computer Science",
                "role": "FACULTY",
                "is_active": True,
            },
            "u-4": {
                "id": "u-4",
                "email": "admin@ves.ac.in",
                "full_name": "Dean Office",
                "department": "Dean Office",
                "role": "ADMIN",
                "is_active": True,
            },
        }

        self._mock_audit_logs: Dict[str, Dict[str, Any]] = {
            "seed-log-1": {
                "id": "seed-log-1",
                "action": "EVENT_APPROVED",
                "target_resource": "events",
                "resource_id": "demo-hackathon-1",
                "actor": "Dean Office (admin@ves.ac.in)",
                "actor_id": None,
                "details": "Published to public campus calendar after venue conflict verification.",
                "created_at": (now - timedelta(minutes=15)).isoformat(),
                "timestamp": (now - timedelta(minutes=15)).isoformat(),
            },
            "seed-log-2": {
                "id": "seed-log-2",
                "action": "ATTENDANCE_SCANNED",
                "target_resource": "attendance",
                "resource_id": "reg-uuid-99",
                "actor": "Gate Scanner (org@ves.ac.in)",
                "actor_id": None,
                "details": "HMAC ticket verified & checked in at Main Auditorium gate.",
                "created_at": (now - timedelta(minutes=45)).isoformat(),
                "timestamp": (now - timedelta(minutes=45)).isoformat(),
            },
            "seed-log-3": {
                "id": "seed-log-3",
                "action": "PROPOSAL_RECOMMENDED",
                "target_resource": "events",
                "resource_id": "demo-workshop-2",
                "actor": "Faculty Advisor (sunita.rao@ves.ac.in)",
                "actor_id": None,
                "details": "Endorsed technical syllabus alignment for IT department workshop.",
                "created_at": (now - timedelta(minutes=120)).isoformat(),
                "timestamp": (now - timedelta(minutes=120)).isoformat(),
            },
            "seed-log-4": {
                "id": "seed-log-4",
                "action": "ROLE_ELEVATED",
                "target_resource": "profiles",
                "resource_id": "u-2",
                "actor": "Admin (admin@ves.ac.in)",
                "actor_id": None,
                "details": "User role transitioned from STUDENT to ORGANIZER.",
                "created_at": (now - timedelta(hours=6)).isoformat(),
                "timestamp": (now - timedelta(hours=6)).isoformat(),
            },
            "seed-log-5": {
                "id": "seed-log-5",
                "action": "AI_DRAFT_GENERATED",
                "target_resource": "ai_assistant",
                "resource_id": "draft-req-44",
                "actor": "Organizer (rohan.mehta@ves.ac.in)",
                "actor_id": None,
                "details": "Mistral Large parsed unstructured prompt into formal college draft.",
                "created_at": (now - timedelta(hours=8)).isoformat(),
                "timestamp": (now - timedelta(hours=8)).isoformat(),
            },
        }

        if (
            not settings.SUPABASE_URL
            or "example.supabase.co" in settings.SUPABASE_URL
            or "test-project.supabase.co" in settings.SUPABASE_URL
            or not settings.SUPABASE_SERVICE_ROLE_KEY
            or "default" in settings.SUPABASE_SERVICE_ROLE_KEY
            or "test-" in settings.SUPABASE_SERVICE_ROLE_KEY
            or settings.APP_ENV == "test"
        ):
            self._is_mock = True
        else:
            try:
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            except Exception:
                self._is_mock = True

    @property
    def is_mock(self) -> bool:
        import os
        return self._is_mock or os.getenv("APP_ENV") == "test" or settings.APP_ENV == "test"


    # =========================================================================
    # User Profiles Management
    # =========================================================================

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mock:
            return self._mock_profiles.get(user_id)

        try:
            res = self._client.table("profiles").select("*").eq("id", user_id).execute()
            return res.data[0] if res.data else None
        except Exception:
            return None

    async def upsert_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = profile_data.get("id")
        if self.is_mock:
            if user_id:
                self._mock_profiles[user_id] = profile_data
            return profile_data

        try:
            res = self._client.table("profiles").upsert(profile_data).execute()
            return res.data[0] if res.data else profile_data
        except Exception:
            if user_id:
                self._mock_profiles[user_id] = profile_data
            return profile_data

    async def list_profiles(self) -> List[Dict[str, Any]]:
        if not self.is_mock and self._client:
            try:
                res = self._client.table("profiles").select("*").execute()
                if res.data:
                    return res.data
            except Exception:
                pass
        return list(self._mock_profiles.values())

    async def update_profile_role(self, user_id: str, new_role: str) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        if not self.is_mock and self._client:
            try:
                res = self._client.table("profiles").update({"role": new_role, "updated_at": now}).eq("id", user_id).execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass

        if user_id in self._mock_profiles:
            self._mock_profiles[user_id]["role"] = new_role
            self._mock_profiles[user_id]["updated_at"] = now
            return self._mock_profiles[user_id]
        
        # If user not in mock profiles yet, create record
        profile = {
            "id": user_id,
            "email": f"user-{user_id[:8]}@ves.ac.in",
            "full_name": f"User {user_id[:8]}",
            "department": "Campus Operations",
            "role": new_role,
            "updated_at": now
        }
        self._mock_profiles[user_id] = profile
        return profile

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

        if self.is_mock:
            self._mock_events[event_id] = record
            return record

        res = self._client.table("events").insert(serialize_record(record)).execute()
        return res.data[0] if res.data else record

    async def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mock:
            return self._mock_events.get(event_id)

        res = self._client.table("events").select("*").eq("id", event_id).execute()
        return res.data[0] if res.data else None

    async def list_events(
        self,
        category_id: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self.is_mock:
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

        if self.is_mock:
            event = self._mock_events.get(event_id)
            if not event:
                return None
            event.update(updates)
            return event

        res = self._client.table("events").update(serialize_record(updates)).eq("id", event_id).execute()
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

        if self.is_mock:
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
        if self.is_mock:
            return self._mock_registrations.get(reg_id)

        res = self._client.table("registrations").select("*").eq("id", reg_id).execute()
        return res.data[0] if res.data else None

    async def get_registration_by_user_event(
        self,
        event_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        if self.is_mock:
            for r in self._mock_registrations.values():
                if r["event_id"] == event_id and r["user_id"] == user_id:
                    return r
            return None

        res = self._client.table("registrations").select("*").eq("event_id", event_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    async def list_user_registrations(self, user_id: str) -> List[Dict[str, Any]]:
        if self.is_mock:
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
        if self.is_mock:
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

        if self.is_mock:
            self._mock_attendance[att_id] = record
            if registration_id in self._mock_registrations:
                self._mock_registrations[registration_id]["status"] = RegistrationStatus.ATTENDED.value
            return record

        res = self._client.table("attendance").insert(record).execute()
        self._client.table("registrations").update({"status": RegistrationStatus.ATTENDED.value}).eq("id", registration_id).execute()
        return res.data[0] if res.data else record

    async def list_event_attendees(self, event_id: str) -> List[Dict[str, Any]]:
        if self.is_mock:
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

        if self.is_mock:
            self._mock_feedbacks[fb_id] = record
            return record

        res = self._client.table("feedbacks").insert(record).execute()
        return res.data[0] if res.data else record

    async def list_event_feedbacks(self, event_id: str) -> List[Dict[str, Any]]:
        if self.is_mock:
            return [f for f in self._mock_feedbacks.values() if f["event_id"] == event_id]

        try:
            res = self._client.table("feedbacks").select("*").eq("event_id", event_id).execute()
            return res.data or []
        except Exception:
            return [f for f in self._mock_feedbacks.values() if f["event_id"] == event_id]

    # =========================================================================
    # Audit Logs
    # =========================================================================

    async def create_audit_log(
        self,
        action: str,
        target_resource: str,
        actor_id: Optional[str] = None,
        actor_name: Optional[str] = None,
        actor_email: Optional[str] = None,
        actor_role: Optional[str] = None,
        actor: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Any] = None,
    ) -> Dict[str, Any]:
        log_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # Build friendly actor representation
        if not actor:
            if actor_name and actor_email:
                actor = f"{actor_name} ({actor_email})"
            elif actor_role and actor_email:
                actor = f"{actor_role.title()} ({actor_email})"
            elif actor_email:
                actor = actor_email
            elif actor_name:
                actor = actor_name
            elif actor_id:
                actor = f"User ({actor_id[:8]})"
            else:
                actor = "System"

        # Format details payload for PostgreSQL JSONB
        if isinstance(details, dict):
            details_payload = {
                **details,
                "actor": actor,
                "actor_email": actor_email,
                "actor_name": actor_name,
                "actor_role": actor_role,
            }
        elif isinstance(details, str):
            details_payload = {
                "message": details,
                "actor": actor,
                "actor_email": actor_email,
                "actor_name": actor_name,
                "actor_role": actor_role,
            }
        else:
            details_payload = {
                "message": str(details) if details else "",
                "actor": actor,
            }

        valid_actor_uuid = actor_id if (actor_id and is_valid_uuid(actor_id)) else None

        record = {
            "id": log_id,
            "action": action,
            "target_resource": target_resource,
            "resource_id": str(resource_id) if resource_id else None,
            "actor_id": valid_actor_uuid,
            "details": details_payload,
            "created_at": now,
        }

        # Cache in memory
        cached_record = {
            **record,
            "actor": actor,
            "timestamp": now,
        }
        self._mock_audit_logs[log_id] = cached_record

        # Persist into Supabase PostgreSQL public.audit_logs
        if not self.is_mock and self._client:
            try:
                res = self._client.table("audit_logs").insert(serialize_record(record)).execute()
                if res.data:
                    saved = res.data[0]
                    saved["actor"] = actor
                    saved["timestamp"] = saved.get("created_at") or now
                    return saved
            except Exception:
                # If foreign key violation on actor_id or client issue, retry without actor_id UUID
                try:
                    if record.get("actor_id") is not None:
                        record["actor_id"] = None
                        res = self._client.table("audit_logs").insert(serialize_record(record)).execute()
                        if res.data:
                            saved = res.data[0]
                            saved["actor"] = actor
                            saved["timestamp"] = saved.get("created_at") or now
                            return saved
                except Exception:
                    pass

        return cached_record

    async def list_audit_logs(
        self,
        limit: int = 100,
        action: Optional[str] = None,
        target_resource: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        # Attempt to fetch directly from Supabase public.audit_logs table
        if not self.is_mock and self._client:
            try:
                query = self._client.table("audit_logs").select("*").order("created_at", desc=True).limit(limit)
                if action and action != "ALL":
                    query = query.eq("action", action)
                if target_resource:
                    query = query.eq("target_resource", target_resource)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    formatted = []
                    for item in res.data:
                        details_data = item.get("details") or {}
                        actor = "System"
                        if isinstance(details_data, dict):
                            actor = details_data.get("actor") or details_data.get("actor_email") or details_data.get("actor_name") or actor
                        elif isinstance(details_data, str) and "(" in details_data:
                            actor = details_data
                        
                        created_at = item.get("created_at")
                        details_msg = details_data.get("message") if isinstance(details_data, dict) else details_data
                        formatted.append({
                            **item,
                            "actor": actor,
                            "details": details_msg or item.get("details"),
                            "timestamp": created_at,
                        })
                    return formatted
            except Exception:
                pass

        # In-memory mock/fallback storage
        logs = list(self._mock_audit_logs.values())
        if action and action != "ALL":
            logs = [l for l in logs if l.get("action") == action]
        if target_resource:
            logs = [l for l in logs if l.get("target_resource") == target_resource]
        logs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return logs[:limit]


supabase_service = SupabaseService()

