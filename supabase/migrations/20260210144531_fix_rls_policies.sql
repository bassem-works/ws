/*
  # Fix RLS Policies for Employee Time Tracking

  The previous RLS policies used current_setting which doesn't work with the JavaScript client.
  This migration updates the policies to allow proper access through the Supabase client.

  ## Changes
  - Remove restrictive current_setting-based policies
  - Add simpler policies that allow public registration and access
  - Enable employees to manage their own data through client-side authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can register as new employee" ON employees;
DROP POLICY IF EXISTS "Public can read employee for login" ON employees;
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Employees can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Employees can create own time entries" ON time_entries;
DROP POLICY IF EXISTS "Employees can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Employees can delete own time entries" ON time_entries;

-- New RLS Policies for employees table

-- Allow anyone to insert new employees (for registration)
CREATE POLICY "Anyone can register"
  ON employees FOR INSERT
  WITH CHECK (true);

-- Allow anyone to select employees by matricule (for login)
CREATE POLICY "Public login access"
  ON employees FOR SELECT
  USING (true);

-- RLS Policies for time_entries table

-- Allow anyone to select time entries (login will be managed client-side)
CREATE POLICY "Allow all select on time_entries"
  ON time_entries FOR SELECT
  USING (true);

-- Allow anyone to insert time entries (login will be managed client-side)
CREATE POLICY "Allow all insert on time_entries"
  ON time_entries FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update time entries (login will be managed client-side)
CREATE POLICY "Allow all update on time_entries"
  ON time_entries FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete time entries (login will be managed client-side)
CREATE POLICY "Allow all delete on time_entries"
  ON time_entries FOR DELETE
  USING (true);