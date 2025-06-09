/*
  # Create admin settings table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `early_booking_restriction` (boolean) - Si está activa la restricción de 12h para 7-8 AM
      - `early_booking_hours` (integer) - Horas de antelación requeridas
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for authenticated users only
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  early_booking_restriction boolean DEFAULT false,
  early_booking_hours integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON admin_settings FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON admin_settings FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" 
ON admin_settings FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" 
ON admin_settings FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO admin_settings (early_booking_restriction, early_booking_hours) 
VALUES (false, 12);