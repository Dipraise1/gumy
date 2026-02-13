-- Run this in Supabase Dashboard → SQL Editor if you get:
--   PGRST204: Could not find the 'updated_at' column of 'users' in the schema cache
-- This adds the missing timestamp columns to an existing users table.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
