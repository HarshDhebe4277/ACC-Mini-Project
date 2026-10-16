-- =============================================================================
-- Migration: 00002_capacity_functions.sql
-- Description: RPC functions to atomically increment / decrement event capacity
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
