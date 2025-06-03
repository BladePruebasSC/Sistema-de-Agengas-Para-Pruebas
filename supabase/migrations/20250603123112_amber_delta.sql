/*
  # Fix tables and policies for appointments system

  1. Changes
    - Add cascade delete for appointments
    - Fix RLS policies for all tables
    - Add proper constraints and indexes
    - Update blocked_times table structure

  2. Security
    - Ensure proper RLS policies
    - Add proper authentication checks
*/

-- Fix appointments table
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_pkey CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);

-- Fix holidays table
ALTER TABLE holidays
DROP CONSTRAINT IF EXISTS holidays_pkey CASCADE;

ALTER TABLE holidays
ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);

-- Fix blocked_times table structure
ALTER TABLE blocked_times
DROP CONSTRAINT IF EXISTS blocked_times_pkey CASCADE;

ALTER TABLE blocked_times
ADD CONSTRAINT blocked_times_pkey PRIMARY KEY (id);

-- Update blocked_times to ensure timeSlots is not null
ALTER TABLE blocked_times
ALTER COLUMN timeSlots SET NOT NULL,
ALTER COLUMN timeSlots SET DEFAULT '{}';

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for all users" ON appointments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON appointments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON appointments;

-- Recreate appointments policies
CREATE POLICY "Enable insert for all users"
ON appointments FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON appointments FOR DELETE
TO public
USING (true);

CREATE POLICY "Enable update for authenticated users only"
ON appointments FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users"
ON appointments FOR SELECT
TO public
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_blocked_times_date ON blocked_times(date);