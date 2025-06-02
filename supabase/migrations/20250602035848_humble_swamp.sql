/*
  # Update appointments table RLS policies

  1. Changes
    - Modify INSERT policy to allow anonymous users to create appointments
    - Keep existing policies for other operations (SELECT, UPDATE, DELETE)
  
  2. Security
    - Allow public access for creating appointments
    - Maintain authenticated-only access for updates and deletions
    - Keep read access public for all users
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON appointments;

-- Create new INSERT policy that allows anonymous users
CREATE POLICY "Enable insert for all users" 
ON appointments
FOR INSERT 
TO public
WITH CHECK (true);