-- Run this in Supabase Dashboard → SQL Editor if high_score never updates in the DB.
-- Leaderboard shows TOTAL GUBS (same as profile "Total"); this script fixes RLS so it can update.
-- Run the ENTIRE script; anon needs SELECT + INSERT + UPDATE.

-- 0a. Anon must be able to SELECT rows before UPDATE can work (Postgres RLS requirement)
DROP POLICY IF EXISTS "Allow anon read users" ON public.users;
CREATE POLICY "Allow anon read users"
    ON public.users FOR SELECT TO anon USING (true);

-- 0b. Anon must be able to UPDATE (high_score, username)
DROP POLICY IF EXISTS "Allow anon update users" ON public.users;
CREATE POLICY "Allow anon update users"
    ON public.users FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 0c. Anon must be able to INSERT (new players)
DROP POLICY IF EXISTS "Allow anon insert users" ON public.users;
CREATE POLICY "Allow anon insert users"
    ON public.users FOR INSERT TO anon WITH CHECK (true);

-- 1. Delete duplicate rows, keeping the one with the highest high_score per lower(wallet_address)
DELETE FROM public.users a
USING public.users b
WHERE lower(a.wallet_address) = lower(b.wallet_address)
  AND a.wallet_address <> b.wallet_address
  AND a.high_score <= b.high_score;

-- 2. Normalize wallet_address to lowercase
UPDATE public.users
SET wallet_address = lower(wallet_address)
WHERE wallet_address <> lower(wallet_address);

-- 3. Verify: list RLS policies (should show SELECT, INSERT, UPDATE for anon)
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
