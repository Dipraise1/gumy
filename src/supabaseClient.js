import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('Supabase URL or Anon Key is missing. Leaderboard and usernames will not work.');
}

/**
 * Debug Supabase connection: env, reachability, and table access.
 * Returns { ok, step, message, details } for UI or console.
 */
async function debugConnection() {
    const details = [];
    const add = (label, value) => details.push({ label, value });

    add('VITE_SUPABASE_URL', supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'MISSING');
    add('VITE_SUPABASE_ANON_KEY', supabaseAnonKey ? `present (${supabaseAnonKey.slice(0, 20)}...)` : 'MISSING');

    if (!supabaseUrl || !supabaseAnonKey) {
        return { ok: false, step: 'env', message: 'Missing .env: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY', details };
    }

    if (!supabase) {
        return { ok: false, step: 'client', message: 'Supabase client not created', details };
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('wallet_address')
            .limit(1);

        add('Query', 'from("users").select().limit(1)');
        add('Error from Supabase', error ? `${error.code || '—'} ${error.message}` : 'none');
        add('Rows returned', Array.isArray(data) ? data.length : '—');

        if (error) {
            let message = error.message;
            if (error.code === 'PGRST116') message = 'Table "users" not found. Run supabase-schema.sql in SQL Editor.';
            else if (error.code === '42501') message = 'RLS blocked read. Run supabase-schema.sql to add policies.';
            return { ok: false, step: 'query', message, details };
        }

        return { ok: true, step: 'query', message: 'Connected. Table "users" readable.', details };
    } catch (err) {
        add('Exception', err.message || String(err));
        return { ok: false, step: 'network', message: err.message || 'Network or CORS error', details };
    }
}

export { supabase, debugConnection };
