const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();

// Deep sanitization: remove ANY character that isn't a valid JWT character (A-Z, a-z, 0-9, -, _, .)
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseServiceKey = rawKey.replace(/[^a-zA-Z0-9\-_.]/g, '');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Security] Missing Supabase configuration. Please check your .env file.');
}

// 1. PUBLIC CLIENT: Used for RLS-scoped operations (with user token)
// This creates a NEW client instance for each request, scoped to the user's JWT.
const createClientWithToken = (token) => {
    return createClient(supabaseUrl, supabaseServiceKey, {
        global: {
            headers: { Authorization: `Bearer ${token}` }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};


/* 
 * NOTE: The 'supabase' client below uses the SERVICE_ROLE_KEY.
 * It bypasses RLS and should ONLY be used for:
 * - Admin tasks
 * - Webhooks
 * - Background jobs
 * - Auth verification (getUser)
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

module.exports = { supabase: supabaseAdmin, supabaseAdmin, createClientWithToken };
