-- Add barber_id to public.blocked_times
ALTER TABLE public.blocked_times
ADD COLUMN barber_id UUID NULL REFERENCES public.barbers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.blocked_times.barber_id IS 'Optional reference to a specific barber for barber-specific blocked times. NULL means it applies to all.';

CREATE INDEX IF NOT EXISTS idx_blocked_times_barber_id ON public.blocked_times(barber_id);

-- Update public.appointments table for barber_id foreign key

-- Make barber_id nullable if it isn't already
ALTER TABLE public.appointments
ALTER COLUMN barber_id DROP NOT NULL;

-- Attempt to drop the existing foreign key constraint if it exists
-- (using a common naming convention, adjust if your actual FK name is different)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_barber_id_fkey'
        AND table_name = 'appointments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.appointments
        DROP CONSTRAINT appointments_barber_id_fkey;
    END IF;
END $$;

-- Add the new foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_barber_id_fkey
FOREIGN KEY (barber_id) REFERENCES public.barbers(id) ON DELETE SET NULL;

COMMENT ON CONSTRAINT appointments_barber_id_fkey ON public.appointments IS 'Foreign key constraint for barber_id referencing barbers table. On barber deletion, sets barber_id to NULL.';
