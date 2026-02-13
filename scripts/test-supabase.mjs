#!/usr/bin/env node
/**
 * Test Supabase connection from CLI.
 * Run: node scripts/test-supabase.mjs
 * Requires: .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('Missing .env file');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase connection test\n');
console.log('VITE_SUPABASE_URL:', url ? `${url.slice(0, 40)}...` : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', key ? `present (${key.slice(0, 25)}...)` : 'MISSING');

if (!url || !key) {
  console.error('\nAdd VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  process.exit(1);
}

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase.from('users').select('wallet_address, username, high_score').limit(3);
  if (error) {
    console.error('\nQuery error:', error.code, error.message);
    if (error.code === 'PGRST116') console.error('→ Table "users" not found. Run supabase-schema.sql in Supabase SQL Editor.');
    if (error.code === '42501') console.error('→ RLS blocked. Run supabase-schema.sql to add policies.');
    process.exit(1);
  }
  console.log('\n✓ Connected. Sample rows:', data?.length ?? 0);
  if (data?.length) console.log(data);
} catch (err) {
  console.error('\nNetwork/error:', err.message);
  process.exit(1);
}
