# Row Level Security (RLS) Policies

## Overview
All tables have RLS **enabled**. This document describes the security boundaries enforced at the database level.

---

## `public.users`

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view their own profile | SELECT | `auth.uid() = id` |

**Note**: No INSERT/UPDATE/DELETE policies exist for users table. User creation is handled by trigger on `auth.users`.

---

## `public.analyses`

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view their own analyses | SELECT | `auth.uid() = user_id` |
| Users can create their own analyses | INSERT | `auth.uid() = user_id` |
| Users can update their own analyses | UPDATE | `auth.uid() = user_id` |

**Note**: No DELETE policy exists. Analyses are permanent audit records.

---

## `public.uploaded_documents`

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view their own documents | SELECT | Subquery: `EXISTS (SELECT 1 FROM analyses WHERE id = analysis_id AND user_id = auth.uid())` |

**Note**: No INSERT/UPDATE/DELETE policies for frontend. Documents are created by backend using service role.

---

## `public.analysis_results`

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view their own results | SELECT | Subquery: `EXISTS (SELECT 1 FROM analyses WHERE id = analysis_id AND user_id = auth.uid())` |

**Note**: No INSERT/UPDATE/DELETE policies for frontend. Results are:
- Created by backend using service role
- **IMMUTABLE** after creation (enforced by trigger `enforce_results_immutability`)

---

## Security Implications

### Backend Uses Service Role Key
The backend (`server/services/supabaseClient.js`) uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS**.

**This is intentional** for:
- Creating analysis records on behalf of authenticated users
- Inserting documents and results
- Updating analysis status during async processing

**This is safe because**:
- Auth middleware validates JWT before any API call
- User ID is extracted from verified JWT, not from client input
- Backend code explicitly sets `user_id` from `req.user.id`

### Frontend Uses Anon Key
The frontend (`client/src/supabase.js`) uses `VITE_SUPABASE_ANON_KEY` which **respects RLS**.

**Frontend can only**:
- Read its own data (via RLS policies)
- Perform auth operations (login, logout, session check)

---

## Cross-User Data Leakage Prevention

| Attack Vector | Protection |
|--------------|------------|
| Direct Supabase query from browser | RLS enforces `auth.uid()` matching |
| API call without auth | 401 from authMiddleware |
| API call with forged user_id | Ignored - backend uses `req.user.id` from JWT |
| Guessing analysis UUID | RLS blocks access to analyses owned by others |
