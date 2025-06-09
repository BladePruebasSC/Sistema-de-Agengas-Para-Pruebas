/*
  # Fix RLS policies for admin tables

  1. Changes
    - Update RLS policies for holidays table
    - Update RLS policies for blocked_times table
    - Ensure proper authentication checks

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users only
    - Restrict access to authenticated users for all operations
*/

-- Update holidays table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON holidays;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON holidays;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON holidays;
DROP POLICY IF EXISTS "Enable read access for all users" ON holidays;

CREATE POLICY "Enable insert for authenticated users only" 
ON holidays FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" 
ON holidays FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" 
ON holidays FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" 
ON holidays FOR SELECT 
TO public 
USING (true);

-- Update blocked_times table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON blocked_times;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON blocked_times;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON blocked_times;
DROP POLICY IF EXISTS "Enable read access for all users" ON blocked_times;

CREATE POLICY "Enable insert for authenticated users only" 
ON blocked_times FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" 
ON blocked_times FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" 
ON blocked_times FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" 
ON blocked_times FOR SELECT 
TO public 
USING (true);