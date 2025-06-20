-- Alter the existing foreign key constraint on public.reviews for barber_id
-- to ensure ON DELETE SET NULL behavior.

-- Step 1: Drop the existing foreign key constraint if it exists.
-- The constraint name might vary if it was not explicitly named.
-- Common default naming pattern for foreign keys is <tablename>_<columnname>_fkey.
-- We'll try to drop a constraint with a common name or one that might have been auto-generated.
-- It's safer to find the actual constraint name from database inspection if possible,
-- but here we'll attempt common patterns.

DO $$
DECLARE
    constraint_name_to_drop text;
BEGIN
    -- Attempt to find the constraint name
    SELECT conname
    INTO constraint_name_to_drop
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass  -- Table name
      AND confrelid = 'public.barbers'::regclass -- Referenced table name
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'public.reviews'::regclass AND attname = 'barber_id') -- Column name
      AND contype = 'f'; -- Foreign key type

    IF constraint_name_to_drop IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.reviews DROP CONSTRAINT ' || quote_ident(constraint_name_to_drop);
    ELSE
        -- As a fallback, try a common default name if the above introspection fails (e.g. due to permissions or complex setup)
        -- This might fail if the constraint name is different and the above also failed.
        BEGIN
            ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_barber_id_fkey;
        EXCEPTION
            WHEN undefined_object THEN
                -- Do nothing if this specific named constraint doesn't exist
        END;
    END IF;
END $$;

-- Step 2: Add the new foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviews_barber_id_on_delete_set_null
FOREIGN KEY (barber_id)
REFERENCES public.barbers(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_reviews_barber_id_on_delete_set_null ON public.reviews IS 'Foreign key to barbers table, sets barber_id to NULL if the barber is deleted.';
