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

