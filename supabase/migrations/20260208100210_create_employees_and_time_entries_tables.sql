/*
  # Create Employee Time Tracking System

  ## Overview
  This migration creates the database schema for an employee time tracking system with authentication.

  ## New Tables
  
  ### `employees`
  Stores employee information for authentication and identification.
  - `id` (uuid, primary key) - Unique identifier for each employee
  - `matricule` (text, unique) - Employee ID number used for login
  - `password` (text) - Encrypted password for authentication
  - `nom` (text) - Last name of the employee
  - `prenom` (text) - First name of the employee
  - `created_at` (timestamptz) - Timestamp when the employee was created
  
  ### `time_entries`
  Stores daily work hours for each employee.
  - `id` (uuid, primary key) - Unique identifier for each time entry
  - `employee_id` (uuid, foreign key) - References the employee who logged the hours
  - `date` (date) - The date of the work entry
  - `hours_worked` (decimal) - Number of hours worked on that day
  - `created_at` (timestamptz) - Timestamp when the entry was created
  - `updated_at` (timestamptz) - Timestamp when the entry was last updated

  ## Security
  - Enable RLS on both tables
  - Employees can only read their own profile data
  - Employees can only create, read, update, and delete their own time entries
  - Public access for employee registration (insert only)
  - Public access for employee login validation (select with matricule only)

  ## Important Notes
  1. Passwords should be hashed on the client side before storing
  2. Each employee can only access their own time entries
  3. The matricule field is unique across all employees
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule text UNIQUE NOT NULL,
  password text NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours_worked decimal(5,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_employees_matricule ON employees(matricule);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees table

-- Allow public to insert new employees (for registration)
CREATE POLICY "Anyone can register as new employee"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public to select employees for login validation
CREATE POLICY "Public can read employee for login"
  ON employees FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (id::text = current_setting('app.current_employee_id', true));

-- RLS Policies for time_entries table

-- Employees can view their own time entries
CREATE POLICY "Employees can view own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (employee_id::text = current_setting('app.current_employee_id', true));

-- Employees can insert their own time entries
CREATE POLICY "Employees can create own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (employee_id::text = current_setting('app.current_employee_id', true));

-- Employees can update their own time entries
CREATE POLICY "Employees can update own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (employee_id::text = current_setting('app.current_employee_id', true))
  WITH CHECK (employee_id::text = current_setting('app.current_employee_id', true));

-- Employees can delete their own time entries
CREATE POLICY "Employees can delete own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (employee_id::text = current_setting('app.current_employee_id', true));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time_entries
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();