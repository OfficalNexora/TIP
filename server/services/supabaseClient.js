const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();

// Deep sanitization: remove ANY character that isn't a valid JWT character (A-Z, a-z, 0-9, -, _, .)
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseServiceKey = rawKey.replace(/[^a-zA-Z0-9\-_.]/g, '');

if (!supabaseUrl || !supabaseServiceKey) {
    const errorMsg = '[Security] Missing Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). Deployment will fail.';
    console.error(errorMsg);
    throw new Error(errorMsg);
}

// 1. PUBLIC CLIENT: Used for RLS-scoped operations (with user token)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

// 2. ADMIN CLIENT: Dedicated instance for administrative tasks
// This ensures Service Role usage is never "polluted" by user sessions in the same process.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

module.exports = { supabase, supabaseAdmin };
