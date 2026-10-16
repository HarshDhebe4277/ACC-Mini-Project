-- =============================================================================
-- Migration: 00001_initial_schema.sql
-- Description: Core Schema, Enums, Tables, Triggers, RLS Policies for College Event System
-- =============================================================================

-- 1. Custom Types & ENUMs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('DRAFT', 'SUBMITTED', 'FACULTY_RECOMMENDED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE certificate_status AS ENUM ('PENDING', 'ISSUED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    department TEXT,
    role user_role DEFAULT 'STUDENT' NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to create profile automatically on Supabase Auth sign-up (Native Email/Password)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_val public.user_role := 'STUDENT';
    raw_role text;
BEGIN
    raw_role := UPPER(COALESCE(new.raw_user_meta_data->>'role', 'STUDENT'));
    IF raw_role IN ('STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN') THEN
        user_role_val := raw_role::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, department, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'department',
        new.raw_user_meta_data->>'avatar_url',
        user_role_val
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department = COALESCE(EXCLUDED.department, public.profiles.department),
        role = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Venues Table
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    capacity INT NOT NULL CHECK (capacity > 0),
    location TEXT NOT NULL,
    facilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_available BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE RESTRICT,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    department TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    current_capacity INT DEFAULT 0 NOT NULL,
    status event_status DEFAULT 'DRAFT' NOT NULL,
    rejection_reason TEXT,
    ai_generated_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_summary TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status registration_status DEFAULT 'CONFIRMED' NOT NULL,
    ticket_qr_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

-- 7. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    marked_by UUID REFERENCES public.profiles(id) NOT NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    attendance_method TEXT CHECK (attendance_method IN ('QR_SCAN', 'MANUAL')) NOT NULL
);

-- 8. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comments TEXT,
    sentiment_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

-- 9. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    certificate_url TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status certificate_status DEFAULT 'ISSUED' NOT NULL
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- Row Level Security (RLS) Configuration
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role securely
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles readable by auth users" ON public.profiles;
CREATE POLICY "Profiles readable by auth users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins full update on profiles" ON public.profiles;
CREATE POLICY "Admins full update on profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.get_current_role() = 'ADMIN');

-- Venues & Categories Policies (Readable by all auth users; editable by Admin)
DROP POLICY IF EXISTS "Venues readable by auth users" ON public.venues;
CREATE POLICY "Venues readable by auth users" ON public.venues
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Venues manageable by admins" ON public.venues;
CREATE POLICY "Venues manageable by admins" ON public.venues
    FOR ALL TO authenticated USING (public.get_current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Categories readable by auth users" ON public.categories;
CREATE POLICY "Categories readable by auth users" ON public.categories
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Categories manageable by admins" ON public.categories;
CREATE POLICY "Categories manageable by admins" ON public.categories
    FOR ALL TO authenticated USING (public.get_current_role() = 'ADMIN');

-- Events Policies
DROP POLICY IF EXISTS "Approved events are viewable by all" ON public.events;
CREATE POLICY "Approved events are viewable by all" ON public.events
    FOR SELECT TO authenticated USING (
        status = 'APPROVED'
        OR organizer_id = auth.uid()
        OR public.get_current_role() IN ('FACULTY', 'ADMIN')
    );

DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
CREATE POLICY "Organizers can create events" ON public.events
    FOR INSERT TO authenticated WITH CHECK (
        public.get_current_role() IN ('ORGANIZER', 'ADMIN')
    );

DROP POLICY IF EXISTS "Organizers edit own drafts" ON public.events;
CREATE POLICY "Organizers edit own drafts" ON public.events
    FOR UPDATE TO authenticated USING (
        (organizer_id = auth.uid() AND status IN ('DRAFT', 'REJECTED'))
        OR public.get_current_role() = 'ADMIN'
        OR (public.get_current_role() = 'FACULTY' AND department = (SELECT department FROM public.profiles WHERE id = auth.uid()))
    );

-- Registrations Policies
DROP POLICY IF EXISTS "Users see own registrations" ON public.registrations;
CREATE POLICY "Users see own registrations" ON public.registrations
    FOR SELECT TO authenticated USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid())
        OR public.get_current_role() IN ('FACULTY', 'ADMIN')
    );

DROP POLICY IF EXISTS "Students can register for approved events" ON public.registrations;
CREATE POLICY "Students can register for approved events" ON public.registrations
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status = 'APPROVED')
    );

-- Attendance Policies
DROP POLICY IF EXISTS "Organizers and admins view attendance" ON public.attendance;
CREATE POLICY "Organizers and admins view attendance" ON public.attendance
    FOR SELECT TO authenticated USING (
        public.get_current_role() IN ('FACULTY', 'ADMIN')
        OR EXISTS (
            SELECT 1 FROM public.registrations r
            JOIN public.events e ON e.id = r.event_id
            WHERE r.id = attendance.registration_id AND e.organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers and admins mark attendance" ON public.attendance;
CREATE POLICY "Organizers and admins mark attendance" ON public.attendance
    FOR INSERT TO authenticated WITH CHECK (
        public.get_current_role() IN ('ORGANIZER', 'ADMIN')
    );

-- Feedback Policies
DROP POLICY IF EXISTS "Feedback readable by organizers and admins" ON public.feedbacks;
CREATE POLICY "Feedback readable by organizers and admins" ON public.feedbacks
    FOR SELECT TO authenticated USING (
        user_id = auth.uid()
        OR public.get_current_role() IN ('FACULTY', 'ADMIN')
        OR EXISTS (SELECT 1 FROM public.events WHERE events.id = feedbacks.event_id AND events.organizer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Attendees can submit feedback" ON public.feedbacks;
CREATE POLICY "Attendees can submit feedback" ON public.feedbacks
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.registrations r
            WHERE r.event_id = feedbacks.event_id AND r.user_id = auth.uid() AND r.status IN ('CONFIRMED', 'ATTENDED')
        )
    );

-- Certificates Policies
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
CREATE POLICY "Users view own certificates" ON public.certificates
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.registrations r
            WHERE r.id = certificates.registration_id AND r.user_id = auth.uid()
        )
        OR public.get_current_role() IN ('FACULTY', 'ADMIN')
    );

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.get_current_role() = 'ADMIN');

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 11. RPC Stored Functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_event_capacity(e_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.events
    SET current_capacity = current_capacity + 1,
        updated_at = NOW()
    WHERE id = e_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_event_capacity(e_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.events
    SET current_capacity = GREATEST(current_capacity - 1, 0),
        updated_at = NOW()
    WHERE id = e_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_event_capacity(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_event_capacity(UUID) TO anon, authenticated, service_role;

