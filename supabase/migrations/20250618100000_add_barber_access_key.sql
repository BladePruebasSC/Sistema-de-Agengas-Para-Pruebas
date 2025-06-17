-- Add access_key to barbers table
ALTER TABLE public.barbers
ADD COLUMN access_key TEXT UNIQUE;

-- Add RLS policy for access_key if needed (example: allow barbers to update their own key)
-- For now, we'll assume admin sets the key.
-- Policies for reading barbers by access_key will be handled by specific backend functions or secured queries.

COMMENT ON COLUMN public.barbers.access_key IS 'A simple text-based key for barbers to access their specific views, should be managed by admins.';

-- Optionally, backfill existing barbers with a null or a default placeholder if required,
-- but for now, new barbers will have it set, and existing ones will be null.
-- Example: UPDATE public.barbers SET access_key = NULL WHERE access_key IS NULL;
-- This is effectively the default for a new nullable column, so no explicit update needed here.
