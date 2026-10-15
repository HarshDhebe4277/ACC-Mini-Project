from datetime import datetime
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ORGANIZER = "ORGANIZER"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    FACULTY_RECOMMENDED = "FACULTY_RECOMMENDED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class RegistrationStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    WAITLISTED = "WAITLISTED"
    CANCELLED = "CANCELLED"
    ATTENDED = "ATTENDED"


class CertificateStatus(str, Enum):
    PENDING = "PENDING"
    ISSUED = "ISSUED"
    REVOKED = "REVOKED"


class AttendanceMethod(str, Enum):
    QR_SCAN = "QR_SCAN"
    MANUAL = "MANUAL"


# =============================================================================
# User & Auth Schemas
# =============================================================================

class UserPayload(BaseModel):
    id: str
    email: str
    role: UserRole = UserRole.STUDENT
    full_name: Optional[str] = None
    department: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    department: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


# =============================================================================
# Venue & Category Schemas
# =============================================================================

class VenueResponse(BaseModel):
    id: str
    name: str
    capacity: int
    location: str
    facilities: List[str] = []
    is_available: bool = True


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None


# =============================================================================
# Event Schemas
# =============================================================================

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category_id: Optional[str] = None
    venue_id: Optional[str] = None
    department: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    max_capacity: int = Field(..., gt=0)
    ai_generated_tags: List[str] = []
    ai_summary: Optional[str] = None
    banner_url: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    venue_id: Optional[str] = None
    department: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    max_capacity: Optional[int] = Field(None, gt=0)
    ai_generated_tags: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    banner_url: Optional[str] = None


class EventRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=5, description="Reason for event rejection")


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    category_id: Optional[str] = None
    venue_id: Optional[str] = None
    organizer_id: str
    department: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    max_capacity: int
    current_capacity: int = 0
    status: EventStatus
    rejection_reason: Optional[str] = None
    ai_generated_tags: List[str] = []
    ai_summary: Optional[str] = None
    banner_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional denormalized display properties
    venue_name: Optional[str] = None
    category_name: Optional[str] = None
    organizer_name: Optional[str] = None


# =============================================================================
# Registration & Ticket Schemas
# =============================================================================

class RegistrationCreate(BaseModel):
    event_id: str


class RegistrationResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    status: RegistrationStatus
    ticket_qr_hash: str
    created_at: datetime
    
    event_title: Optional[str] = None
    event_start_time: Optional[datetime] = None
    event_location: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None


# =============================================================================
# Attendance Schemas
# =============================================================================

class AttendanceScanRequest(BaseModel):
    ticket_qr_hash: str
    event_id: Optional[str] = None


class AttendanceScanResponse(BaseModel):
    success: bool
    message: str
    registration_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    event_id: str
    event_title: Optional[str] = None
    marked_at: datetime
    attendance_method: AttendanceMethod = AttendanceMethod.QR_SCAN


# =============================================================================
# Feedback Schemas
# =============================================================================

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    rating: int
    comments: Optional[str] = None
    sentiment_tag: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None


# =============================================================================
# Certificate & Report Schemas
# =============================================================================

class CertificateResponse(BaseModel):
    id: str
    registration_id: str
    certificate_url: str
    issued_at: datetime
    status: CertificateStatus
    event_title: Optional[str] = None
    user_name: Optional[str] = None


class AttendanceReportItem(BaseModel):
    student_name: str
    student_email: str
    department: Optional[str] = None
    status: RegistrationStatus
    attended: bool
    marked_at: Optional[datetime] = None


class EventAttendanceReport(BaseModel):
    event_id: str
    event_title: str
    department: str
    total_registrations: int
    total_attended: int
    attendance_rate_percent: float
    attendees: List[AttendanceReportItem]


# =============================================================================
# Audit Log Schemas
# =============================================================================

class AuditLogCreate(BaseModel):
    action: str
    target_resource: str
    resource_id: Optional[str] = None
    details: Optional[Any] = None
    actor_id: Optional[str] = None
    actor: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: str
    action: str
    target_resource: str
    resource_id: Optional[str] = None
    actor_id: Optional[str] = None
    actor: str = "System"
    details: Any = None
    created_at: datetime
    timestamp: Optional[datetime] = None


