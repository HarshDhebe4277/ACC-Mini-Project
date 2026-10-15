-- =============================================================================
-- Seed Data: supabase/seed.sql
-- Description: Standard venues and categories for campus events
-- =============================================================================

-- Seed Venues
INSERT INTO public.venues (name, capacity, location, facilities, is_available) VALUES
('Main Auditorium', 800, 'Campus Building A, Ground Floor', ARRAY['Projector', 'Dolby Sound', 'Stage Lighting', 'Air Conditioning', 'WiFi'], true),
('Seminar Hall 1', 150, 'Academic Block 2, 3rd Floor', ARRAY['Projector', 'Podium Mic', 'Air Conditioning', 'WiFi'], true),
('Seminar Hall 2', 120, 'Academic Block 3, 2nd Floor', ARRAY['Smart Display', 'Microphone System', 'Air Conditioning'], true),
('Central Computer Lab', 80, 'IT Block, 1st Floor', ARRAY['80 High-End Workstations', 'LAN', 'Projector', 'UPS Backup'], true),
('Open Air Amphitheatre', 1200, 'Central Campus Ground', ARRAY['Outdoor Stage', 'Floodlights', 'Sound Rig'], true),
('Sports Complex Arena', 500, 'Campus Gymkhana', ARRAY['Indoor Badminton Courts', 'Scoreboard', 'Seating Stands'], true)
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (name, description) VALUES
('Technical', 'Hackathons, coding contests, robotics competitions, and tech symposiums'),
('Cultural', 'Music festivals, drama productions, dance performances, and art showcases'),
('Sports', 'Inter-department and inter-collegiate tournaments, athletics, and esports'),
('Workshop & Guest Lecture', 'Hands-on skill building, industry guest speakers, and research seminars'),
('Social & Community', 'Blood donation camps, tree plantation drives, and social welfare initiatives')
ON CONFLICT (name) DO NOTHING;

-- Seed Operational Audit Logs
INSERT INTO public.audit_logs (action, target_resource, resource_id, details, created_at) VALUES
('EVENT_APPROVED', 'events', 'demo-hackathon-1', '{"message": "Published to public campus calendar after venue conflict verification.", "actor": "Dean Office (admin@ves.ac.in)"}'::jsonb, NOW() - INTERVAL '15 minutes'),
('ATTENDANCE_SCANNED', 'attendance', 'reg-uuid-99', '{"message": "HMAC ticket verified & checked in at Main Auditorium gate.", "actor": "Gate Scanner (org@ves.ac.in)"}'::jsonb, NOW() - INTERVAL '45 minutes'),
('PROPOSAL_RECOMMENDED', 'events', 'demo-workshop-2', '{"message": "Endorsed technical syllabus alignment for IT department workshop.", "actor": "Faculty Advisor (sunita.rao@ves.ac.in)"}'::jsonb, NOW() - INTERVAL '120 minutes'),
('ROLE_ELEVATED', 'profiles', 'u-2', '{"message": "User role transitioned from STUDENT to ORGANIZER.", "actor": "Admin (admin@ves.ac.in)"}'::jsonb, NOW() - INTERVAL '6 hours'),
('AI_DRAFT_GENERATED', 'ai_assistant', 'draft-req-44', '{"message": "Mistral Large parsed unstructured prompt into formal college draft.", "actor": "Organizer (rohan.mehta@ves.ac.in)"}'::jsonb, NOW() - INTERVAL '8 hours');


