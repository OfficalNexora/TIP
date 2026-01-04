-- SUPABASE SCHEMA: UNESCO AI Mirror (TIP AI) - PHASE 3: INSTITUTIONAL AUDIT
-- Focus: Persistence, Immutability, and OpenAI Integration
-- ⚠️ READ-ONLY REFERENCE FILE - DO NOT EXECUTE DIRECTLY ⚠️

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
    create type analysis_status as enum ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
exception
    when duplicate_object then null;
end $$;

-- 3. DOMAIN TABLES

-- USERS (Synced from auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  institutional_id text,
  role text default 'auditor',
  organization_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANALYSES
create table if not exists public.analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  status analysis_status not null default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  error_reason text
);

-- UPLOADED DOCUMENTS
create table if not exists public.uploaded_documents (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references public.analyses(id) on delete cascade not null,
  filename text not null,
  file_type text,
  file_size bigint,
  storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANALYSIS RESULTS (Institutional Audit Trail)
create table if not exists public.analysis_results (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references public.analyses(id) on delete cascade not null,
  result_json jsonb not null,
  system_prompt_version text,
  model_name text,                    -- ⚠️ CORRECT COLUMN NAME
  openai_response_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ROW LEVEL SECURITY (RLS)
-- See policies.md for full documentation

-- 5. INDEXES (Performance & Auditability)
-- analyses_user_id_idx on public.analyses (user_id);
-- analyses_status_idx on public.analyses (status);
-- docs_analysis_id_idx on public.uploaded_documents (analysis_id);
-- results_analysis_id_idx on public.analysis_results (analysis_id);

-- 6. FUNCTIONS & TRIGGERS
-- See triggers.md for full documentation
