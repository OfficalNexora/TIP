-- ============================================================================
-- UNESCO AI MIRROR: COMPLETE DATABASE SETUP (PHASE 0, 1, 2 SUPPORT)
-- ============================================================================
-- This script resets and rebuilds the entire database schema.
-- It aligns with the Production Architecture Audit solutions.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & CONSTANTS
-- (None strictly required, using TEXT constraints for flexibility)

-- ============================================================================
-- 3. PUBLIC.USERS (Profile & Subscription)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    organization_id TEXT, -- 'UNESCO', 'DepEd', etc.
    role TEXT DEFAULT 'Auditor', -- 'Admin', 'Auditor', 'Viewer'
    
    -- Billing & Subscription (Phase 1/3)
    subscription_status TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    subscription_metadata JSONB DEFAULT '{}'::jsonb,
    stripe_customer_id TEXT,
    
    -- Settings (Phase 1 Expansion)
    settings JSONB DEFAULT '{
      "theme": "system",
      "notifications": true,
      "language": "fil-PH"
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for billing lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- RLS: Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

-- Trigger: Handle New User (Sync Auth -> Public)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow clean reset
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 4. ANALYSES (Core Entity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    confidence TEXT, -- 'mataas', 'katamtaman', 'mababa' or numeric string
    full_text TEXT, -- Extracted text cache
    error_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

-- RLS: Analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.analyses 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.analyses 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses 
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. UPLOADED DOCUMENTS (Phase 2: Idempotency Support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT, -- 'application/pdf', etc.
    storage_path TEXT NOT NULL,
    
    -- Phase 2: Idempotency
    file_hash TEXT, -- SHA-256 hash of binary content
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_analysis_id ON uploaded_documents(analysis_id);
-- Optional: Global index on hash for deduplication check (Phase 2)
CREATE INDEX IF NOT EXISTS idx_docs_file_hash ON uploaded_documents(file_hash);

-- RLS: Documents
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Inherit ownership from analysis
CREATE POLICY "Users can view own documents" ON public.uploaded_documents 
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid() )
    );

CREATE POLICY "Users can insert own documents" ON public.uploaded_documents 
    FOR INSERT WITH CHECK (
        EXISTS ( SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid() )
    );

-- ============================================================================
-- 6. ANALYSIS RESULTS (Structured AI Output)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    
    result_json JSONB NOT NULL, -- Full AI output
    
    model_name TEXT, -- 'llama-3.3-70b', etc.
    system_prompt_version TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_analysis_id ON analysis_results(analysis_id);

-- RLS: Results
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.analysis_results 
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid() )
    );
    
-- Service role handles inserts via worker

-- ============================================================================
-- 7. SECURITY & LOGGING (Phase 1)
-- ============================================================================

-- 7.1 User Security Settings
CREATE TABLE IF NOT EXISTS public.user_security (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSONB, 
    last_password_change TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view/edit own security" ON public.user_security
    FOR ALL USING (auth.uid() = user_id);

-- 7.2 Security Audit Logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, 
    status TEXT NOT NULL,
    ip_address TEXT,
    location TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.security_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 7.3 Scan Usage Logs (Immutable Billing History)
CREATE TABLE IF NOT EXISTS public.scan_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.scan_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.scan_usage_logs
    FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 8. UTILITIES
-- ============================================================================

-- Auto-Update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_analyses_modtime
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
