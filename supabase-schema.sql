-- Run this in Supabase Dashboard → SQL Editor to create the table and allow leaderboard + saves.
-- https://supabase.com/dashboard/project/YOUR_REF/sql
-- If you get PGRST204 "Could not find updated_at column", run supabase-migration-add-timestamps.sql first.
-- If leaderboard score does not update after a game, run supabase-migration-normalize-wallet.sql.

-- 1. Create users table (skip if you already have it)
CREATE TABLE IF NOT EXISTS public.users (
    wallet_address TEXT PRIMARY KEY,
    username TEXT,
    high_score BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if re-running (optional)
-- DROP POLICY IF EXISTS "Allow anon read users" ON public.users;
-- DROP POLICY IF EXISTS "Allow anon insert users" ON public.users;
-- DROP POLICY IF EXISTS "Allow anon update users" ON public.users;

-- 4. Policies so the app (anon key) can read leaderboard and save scores
CREATE POLICY "Allow anon read users"
    ON public.users FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anon insert users"
    ON public.users FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon update users"
    ON public.users FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. Optional: index for leaderboard sort
CREATE INDEX IF NOT EXISTS users_high_score_desc ON public.users (high_score DESC NULLS LAST);
