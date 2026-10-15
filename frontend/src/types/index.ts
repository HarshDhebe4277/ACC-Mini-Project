export type UserRole = 'STUDENT' | 'ORGANIZER' | 'FACULTY' | 'ADMIN';

export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'FACULTY_RECOMMENDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  department?: string;
  role: UserRole;
  avatar_url?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category_id?: string;
  venue_id?: string;
  organizer_id: string;
  department: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  max_capacity: number;
  current_capacity: number;
  status: EventStatus;
  rejection_reason?: string;
  ai_generated_tags: string[];
  ai_summary?: string;
  banner_url?: string;
  created_at: string;
  updated_at: string;
  venue_name?: string;
  category_name?: string;
  organizer_name?: string;
}

export interface RegistrationItem {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  ticket_qr_hash: string;
  created_at: string;
  event_title?: string;
  event_start_time?: string;
  event_location?: string;
  user_name?: string;
  user_email?: string;
}

export interface AttendanceScanResult {
  success: boolean;
  message: string;
  registration_id: string;
  user_name?: string;
  event_id: string;
  event_title?: string;
  marked_at: string;
  attendance_method: string;
}

export interface FeedbackItem {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comments?: string;
  sentiment_tag?: string;
  created_at: string;
  user_name?: string;
}

export interface AttendanceReport {
  event_id: string;
  event_title: string;
  department: string;
  total_registrations: number;
  total_attended: number;
  attendance_rate_percent: number;
  attendees: Array<{
    student_name: string;
    student_email: string;
    department?: string;
    status: RegistrationStatus;
    attended: boolean;
    marked_at?: string;
  }>;
}

export interface AIDraftResponse {
  title: string;
  description: string;
  tags: string[];
  prerequisites: string[];
  suggested_agenda: string[];
  suggested_capacity: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor_id?: string | null;
  actor: string;
  target_resource: string;
  resource_id?: string | null;
  details: string | Record<string, any>;
  created_at?: string;
  timestamp: string;
}


