/*
  # Update Time Entries Schema for Time Slots

  This migration updates the time_entries table to store start and end times instead of just total hours.

  ## Changes
  - Add `start_time` column (time format) - start time of work shift
  - Add `end_time` column (time format) - end time of work shift
  - Keep `hours_worked` for backwards compatibility (will be calculated from times)
  - Add shift_type column to indicate morning/afternoon shift

  ## Important Notes
  1. Start and end times are in HH:MM format (24-hour)
  2. Default shifts: morning (6:00-14:00) or afternoon (14:00-22:00)
  3. Times can be adjusted in 30-minute increments
*/

DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN start_time time DEFAULT '06:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN end_time time DEFAULT '14:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'shift_type'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN shift_type text DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'custom'));
  END IF;
END $$;