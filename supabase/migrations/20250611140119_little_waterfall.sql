/*
  # Safely create admin settings table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `early_booking_restriction` (boolean) - Si está activa la restricción de 12h para 7-8 AM
      - `early_booking_hours` (integer) - Horas de antelación requeridas
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policies for public read access and authenticated user management

  3. Data
    - Insert default settings if table is empty
*/

-- Create the admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  early_booking_restriction boolean DEFAULT false,
  early_booking_hours integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON admin_settings;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admin_settings;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON admin_settings;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON admin_settings;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Policy doesn't exist, continue
END $$;

-- Create policies
CREATE POLICY "Enable read access for all users" 
ON admin_settings FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON admin_settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" 
ON admin_settings FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" 
ON admin_settings FOR DELETE 
TO authenticated 
USING (true);

-- Insert default settings only if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1) THEN
    INSERT INTO admin_settings (early_booking_restriction, early_booking_hours) 
    VALUES (false, 12);
  END IF;
END $$;