/*
  # Fix schema issues and missing columns

  1. Missing Columns
    - Add `cancelled` column to appointments table if it doesn't exist
    - Add `cancelled_at` column to appointments table if it doesn't exist
    - Add `barber_id` column to appointments table if it doesn't exist

  2. Data Consistency
    - Ensure admin_settings has at least one record
    - Update any existing appointments to have proper barber_id references

  3. Index Optimization
    - Add indexes for better query performance
*/

-- Add missing columns to appointments table
DO $$
BEGIN
  -- Add cancelled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancelled'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancelled boolean DEFAULT false;
  END IF;

  -- Add cancelled_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancelled_at timestamptz;
  END IF;

  -- Add barber_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'barber_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN barber_id uuid REFERENCES barbers(id);
  END IF;
END $$;

-- Ensure admin_settings has at least one record
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1) THEN
    INSERT INTO admin_settings (
      early_booking_restriction, 
      early_booking_hours,
      restricted_hours,
      multiple_barbers_enabled
    ) VALUES (
      false, 
      12,
      ARRAY['7:00 AM', '8:00 AM'],
      false
    );
  END IF;
END $$;

-- Update admin_settings to have proper default_barber_id if it's null
UPDATE admin_settings 
SET default_barber_id = (SELECT id FROM barbers WHERE name = 'Gastón' LIMIT 1)
WHERE default_barber_id IS NULL;

-- Update any appointments that don't have a barber_id assigned
UPDATE appointments 
SET barber_id = (SELECT id FROM barbers WHERE name = 'Gastón' LIMIT 1)
WHERE barber_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled ON appointments(cancelled);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date_cancelled ON appointments(barber_id, date, cancelled);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(clientPhone);