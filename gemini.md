# gemini.md — UNESCO AI Mirror Project Governor

> **Authority**: This file is the canonical reference for all development decisions.
> **Enforcement**: All PRs must reference this file. All coding must check this file first.
> **Last Updated**: 2025-12-26

---

## 1. PROJECT TRUTHS (What Is Real)

### ✅ Features That Work End-to-End

| Feature | Frontend | Backend | Supabase | Status |
|---------|----------|---------|----------|--------|
| User Authentication | ✅ Supabase Auth | ✅ JWT Validation | ✅ RLS | **WORKING** |
| Create Analysis | ✅ API Call | ✅ INSERT | ✅ Persisted | **WORKING** |
| Upload Document | ✅ XHR Streaming | ✅ Busboy Parser | ⚠️ Local FS | **WORKING (local only)** |
| AI Ethics Analysis | ✅ Polling UI | ✅ Gemini/OpenAI | ✅ Results Persisted | **WORKING** |
| View Results | ✅ Hydrates from API | ✅ Queries DB | ✅ RLS Protected | **WORKING** |
| Scan History | ✅ Lists from API | ✅ Paginated Query | ✅ RLS Protected | **WORKING** |

### ❌ Features That Are Fake/Non-Functional

| Feature | What User Sees | What Actually Happens |
|---------|---------------|----------------------|
| User Profile | Name, Role, Certs, Stats | 100% hardcoded in `server/index.js` |
| Settings Page | Full settings UI | 100% local React state, nothing persists |
| Subscription/Billing | Plans, pricing, upgrade button | Zero backend, zero Stripe integration |
| "98% Avg. Integrity" | Displayed on Overview | Hardcoded, not computed from data |
| Compliance Profile | Credentials, certifications | Hardcoded mock data |
| Data Export | "Request Data Export" button | No-op, does nothing |
| Password Change | Button exists | No implementation |
| 2FA | Shows "Enabled" | No implementation |
| Integrations (Slack, Jira) | Shows connection UI | No implementation |

---

## 2. SUPABASE IS LAW

### Schema is Immutable
The Supabase schema provided in `/supabase/schema.sql` is the **single source of truth**.
- Do NOT add columns without formal schema change process
- Do NOT rename columns in code - use what exists
- Do NOT bypass RLS policies

### Active Tables

| Table | Purpose | Writable From |
|-------|---------|---------------|
| `users` | User profiles (auto-synced) | Trigger only |
| `analyses` | Audit job records | Backend (service role) |
| `uploaded_documents` | Document metadata | Backend (service role) |
| `analysis_results` | AI audit results | Backend (service role), **IMMUTABLE** |

### RLS Enforcement
All queries from frontend (anon key) are subject to RLS:
- Users can only see their own data
- No cross-user data leakage is possible via frontend

### Trigger Behavior
1. `on_auth_user_created` → Syncs `auth.users` to `public.users`
2. `update_analyses_updated_at` → Auto-updates timestamp
3. `enforce_results_immutability` → **BLOCKS ALL UPDATES to analysis_results**

---

## 3. WHAT FRONTEND MUST NEVER FAKE

### Prohibited Patterns

1. **Never show success without backend confirmation**
   - ❌ "Upload complete!" before 204 response
   - ❌ "Analysis saved!" before API returns

2. **Never display computed stats locally**
   - ❌ Calculating "Total Reports" without fetching
   - ❌ Showing "98% Integrity" without real data

3. **Never maintain critical state in React only**
   - ❌ User profile stored only in `useState`
   - ❌ Settings preferences without persistence

4. **Never assume feature exists without backend**
   - ❌ Subscription upgrade flow with no Stripe
   - ❌ Password change with no auth update

### Required Patterns

1. **Always show loading states during async ops**
2. **Always handle error states from API**
3. **Always display empty states when data is empty**
4. **Always tie UI states to database truth**

---

## 4. ALLOWED SHORTCUTS (Temporary)

The following shortcuts are **acceptable for MVP launch** but must be addressed post-launch:

| Shortcut | Why Acceptable | Post-Launch Action |
|----------|---------------|-------------------|
| Local filesystem storage | Works for single-server | Migrate to Supabase Storage |
| Hardcoded user profile | Users don't need to edit yet | Implement proper profile API |
| Settings not persisted | Preferences are non-critical | Add preferences table |
| No subscription backend | Free tier only for launch | Integrate Stripe |

---

## 5. FORBIDDEN PATTERNS

### Code Patterns That Must Never Exist

```javascript
// ❌ FORBIDDEN: Bypassing user_id from JWT
const userId = req.body.user_id; // NEVER - use req.user.id

// ❌ FORBIDDEN: Updating analysis_results
await supabase.from('analysis_results').update(...); // Will always fail

// ❌ FORBIDDEN: Using wrong column names
{ inference_model: modelName } // WRONG - column is "model_name"

// ❌ FORBIDDEN: Frontend making direct Supabase writes to protected tables
supabase.from('analysis_results').insert(...); // No RLS policy allows this
```

### Architecture Patterns That Are Forbidden

1. **Storing files in Supabase Storage without updating schema**
   - Current `storage_path` assumes local filesystem
   
2. **Creating new tables without /supabase folder update**
   - All schema changes must be documented first

3. **Adding features that bypass authentication**
   - All `/api/*` routes require auth middleware

4. **Modifying completed analysis results**
   - Immutability is enforced by trigger

---

## 6. PRE-CODING CHECKLIST

Before writing ANY code, developer MUST verify:

### Database Operations
- [ ] Does the table exist in `/supabase/schema.sql`?
- [ ] Does RLS allow this operation? (See `/supabase/rls-summary.md`)
- [ ] Am I using correct column names?
- [ ] Will a trigger affect this operation?

### API Endpoints
- [ ] Is auth middleware applied?
- [ ] Am I using `req.user.id` (not client-provided ID)?
- [ ] Is the response format consistent with other endpoints?

### Frontend Features
- [ ] Does this feature have a working backend?
- [ ] Am I showing honest loading/error states?
- [ ] Is the data source from Supabase (not local state)?

---

## 7. DEPLOYMENT READINESS CHECKLIST

### Environment Configuration

| Variable | Server | Client | Status |
|----------|--------|--------|--------|
| `SUPABASE_URL` | ⚠️ Placeholder | ✅ Real | **MUST FIX SERVER** |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Placeholder | N/A | **MUST FIX** |
| `SUPABASE_JWT_URL` | ⚠️ Placeholder | N/A | **MUST FIX** |
| `GEMINI_API_KEY` | ✅ Real | N/A | OK |
| `VITE_SUPABASE_URL` | N/A | ✅ Real | OK |
| `VITE_SUPABASE_ANON_KEY` | N/A | ✅ Real | OK |
| `VITE_API_BASE_URL` | N/A | ⚠️ localhost | **MUST FIX FOR PROD** |

### Code Fixes Required

| Issue | File | Fix Required |
|-------|------|-------------|
| Wrong column name | `analysisWorker.js:38` | Change `inference_model` → `model_name` |
| Orphan function | `ethicsService.js` | Remove `processAnalysis()` or refactor |
| Hardcoded profile | `index.js:233-248` | Remove or mark as mock |
| Local storage | `storageService.js` | Migrate to cloud storage |

### Features To Remove From UI Before Launch

| Feature | Component | Reason |
|---------|-----------|--------|
| Subscription Modal | `SubscriptionModal.jsx` | No Stripe backend |
| Settings (all tabs except Profile) | `Settings.jsx` | No persistence |
| Compliance Profile stats | `ComplianceProfile.jsx` | Hardcoded data |
| "Change Password" button | `Settings.jsx` | No implementation |
| "Delete Account" button | `Settings.jsx` | No implementation |
| Integration connections | `Settings.jsx` | No implementation |

---

## 8. PRODUCTION FAILURE MODES

### At 10 Users
- **Works fine** - Local filesystem can handle small files
- **Risk**: Concurrent uploads to same server might conflict

### At 1,000 Users
- **Disk space exhaustion** - Local storage fills up
- **Supabase connection pool** - Default limits may be hit
- **AI API rate limits** - Gemini/OpenAI quotas exceeded

### At 100,000 Users
- **Storage migration required** - Must use cloud storage
- **Database scaling** - May need connection pooling
- **Worker queue needed** - Async processing must be distributed
- **CDN required** - Static assets must be edge-cached

---

## 9. CRITICAL BUGS IDENTIFIED

### 🔴 SEVERITY: CRITICAL (Blocks Production)

1. **Server .env has placeholder Supabase config**
   - File: `server/.env`
   - Impact: Server will fail all database operations
   - Fix: Replace placeholders with real credentials

2. **Column name mismatch in analysisWorker**
   - File: `server/services/analysisWorker.js:38`
   - Code: `inference_model: auditData.model_name`
   - Schema: Column is `model_name`
   - Impact: INSERT will fail or silently drop data
   - Fix: Change to `model_name: auditData.model_name`

### 🟠 SEVERITY: HIGH (Feature Broken)

3. **Orphan processAnalysis function**
   - File: `server/services/ethicsService.js:149-188`
   - Issue: Writes to non-existent `results` column on `analyses` table
   - Impact: If called, will error silently
   - Fix: Remove function (analysisWorker is the active path)

4. **Frontend parses confidence as integer**
   - Files: `ScanHistory.jsx`, `Overview.jsx`
   - Issue: `parseInt(file.confidence)` fails for Filipino strings like "mataas"
   - Impact: Progress bars always show 0%
   - Fix: Normalize confidence to numeric in backend

### 🟡 SEVERITY: MEDIUM (UX Issue)

5. **Hardcoded "98% Avg. Integrity"**
   - File: `Overview.jsx:40`
   - Impact: Misleading users
   - Fix: Compute from actual data or remove

---

## 10. LAUNCH READINESS VERDICT

### Can We Ship Today?

**NO** - Critical blockers exist:

1. ⛔ Server environment variables are placeholders
2. ⛔ Column name bug will cause worker failures
3. ⚠️ Multiple fake UI features will confuse users

### What MUST Be Fixed Today

| Priority | Task | Estimated Time |
|----------|------|----------------|
| 1 | Configure real Supabase credentials in server `.env` | 5 min |
| 2 | Fix `inference_model` → `model_name` in analysisWorker | 2 min |
| 3 | Remove or hide fake features from UI | 30 min |
| 4 | Test end-to-end flow with real Supabase | 15 min |

### What Can Be Postponed

- Settings persistence
- Subscription/billing
- Cloud storage migration (if user volume is low)
- Profile customization
- Integration features

### What MUST Be Removed From UI

Before launch, hide or remove:
- Subscription Modal (or make it "Coming Soon")
- Settings tabs: Security, Billing, Privacy, Integrations
- Compliance Profile (replace with simpler view)
- Any stats not computed from real data

---

## APPENDIX: File Index

| File | Purpose | Connected to Supabase |
|------|---------|----------------------|
| `client/src/supabase.js` | Supabase client (anon key) | ✅ Auth only |
| `client/src/App.jsx` | Main app, auth state | ✅ Via supabase.js |
| `server/services/supabaseClient.js` | Supabase client (service role) | ✅ Full access |
| `server/middleware/authMiddleware.js` | JWT validation | ✅ Via JWKS |
| `server/services/analysisWorker.js` | AI processing | ✅ Writes results |
| `server/services/openaiService.js` | OpenAI calls | ❌ AI only |
| `server/services/ethicsService.js` | Gemini calls | ⚠️ Orphan function |
| `server/services/storageService.js` | File storage | ❌ Local FS only |
| `client/src/components/dashboard/Settings.jsx` | User settings | ❌ Local state only |
| `client/src/components/dashboard/SubscriptionModal.jsx` | Billing UI | ❌ No backend |
| `client/src/components/dashboard/ComplianceProfile.jsx` | Profile view | ⚠️ Hardcoded API |

---

**END OF GOVERNANCE DOCUMENT**

*This file must be updated whenever schema, RLS policies, or feature status changes.*
