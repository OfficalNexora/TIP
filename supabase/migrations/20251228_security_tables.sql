-- SECURITY PHASE: Backup Codes & Audit Logs

-- 1. USER SECURITY TABLE
-- Stores sensitive security settings separate from the main profile (users table).
-- Used for Backup Codes and 2FA toggles.
create table if not exists public.user_security (
    user_id uuid references auth.users(id) on delete cascade not null primary key,
    two_factor_enabled boolean default false,
    backup_codes jsonb, -- Stores encrypted/hashed codes in production. For this phase: JSON array of {code: '...', used: false}
    last_password_change timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SECURITY AUDIT LOGS
-- Immutable log of security-critical actions (Logic, Password Changes, 2FA, Backup Code Generation).
create table if not exists public.security_audit_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    event_type text not null, -- 'LOGIN', 'LOGOUT', 'BACKUP_CODES_GENERATED', '2FA_ENABLED'
    status text not null, -- 'SUCCESS', 'FAILURE', 'WARNING'
    ip_address text, -- Can be anonymized in application layer
    location text, -- Approximate region (e.g., 'Manila, PH')
    user_agent text,
    metadata jsonb, -- Extra context (e.g., failure reason)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. INDEXES
create index if not exists idx_security_logs_user_id on public.security_audit_logs(user_id);
create index if not exists idx_security_logs_created_at on public.security_audit_logs(created_at desc);

-- 4. RLS POLICIES (SECURITY)
alter table public.user_security enable row level security;
alter table public.security_audit_logs enable row level security;

-- User can read their own security settings
create policy "Users can view own security settings"
    on public.user_security for select
    using (auth.uid() = user_id);

-- User can update their own security settings (via API interaction)
create policy "Users can update own security settings"
    on public.user_security for update
    using (auth.uid() = user_id);

-- Users can insert their own security settings (on profile creation)
create policy "Users can insert own security settings"
    on public.user_security for insert
    with check (auth.uid() = user_id);

-- Users can view their own audit logs
create policy "Users can view own audit logs"
    on public.security_audit_logs for select
    using (auth.uid() = user_id);

-- Application (via Service Role or User) can insert logs
create policy "Users can insert own audit logs"
    on public.security_audit_logs for insert
    with check (auth.uid() = user_id);
