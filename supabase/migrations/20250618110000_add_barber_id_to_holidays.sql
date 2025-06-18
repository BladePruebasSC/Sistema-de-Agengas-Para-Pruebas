-- Add barber_id to holidays table
ALTER TABLE public.holidays
ADD COLUMN barber_id UUID;

-- Add foreign key constraint to barbers table
ALTER TABLE public.holidays
ADD CONSTRAINT fk_holidays_barber_id
FOREIGN KEY (barber_id)
REFERENCES public.barbers(id)
ON DELETE SET NULL; -- Or ON DELETE CASCADE, depending on desired behavior. SET NULL is safer if a barber is deleted.

COMMENT ON COLUMN public.holidays.barber_id IS 'Optional reference to a specific barber for barber-specific holidays. NULL means it applies to all.';

-- Add an index for faster lookups if querying holidays by barber_id
CREATE INDEX IF NOT EXISTS idx_holidays_barber_id ON public.holidays(barber_id);
