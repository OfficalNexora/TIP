# Schema Assumptions

## Critical Assumptions That Affect Application Code

### 1. User ID Source
**Assumption**: `user_id` in `analyses` table comes from authenticated JWT, never from client input.
**Why**: RLS policies assume `user_id` is trustworthy. If client could set it, cross-user access would be possible.
**Code Impact**: Backend must always use `req.user.id` (from verified JWT), not `req.body.user_id`.

---

### 2. Analysis Status State Machine
**Assumption**: Status follows strict progression: `PENDING` → `PROCESSING` → `COMPLETED | FAILED`
**Why**: Frontend UI and polling logic depend on these exact states.
**Code Impact**: 
- Backend must never skip states
- Frontend must handle all states
- No "CANCELLED" or "RETRYING" states exist

---

### 3. Result Immutability
**Assumption**: Once `analysis_results` has a row for an `analysis_id`, it cannot be changed.
**Why**: Institutional audit trail requirement.
**Code Impact**:
- Backend must ensure AI response is valid before INSERT
- No retry logic can "update" a failed result - must fail the entire analysis
- Frontend must never expect result content to change after COMPLETED

---

### 4. One Result Per Analysis
**Assumption**: Each analysis has exactly 0 or 1 result row.
**Why**: Schema has `analysis_id` as a foreign key without unique constraint, but application logic assumes 1:1.
**Code Impact**: 
- Backend uses `.single()` when querying results
- Multiple results for same analysis would break queries
- ⚠️ **RISK**: Schema should have `UNIQUE(analysis_id)` constraint

---

### 5. One Document Per Analysis (Current)
**Assumption**: Each analysis has exactly 1 uploaded document.
**Why**: Current upload flow only handles single file.
**Code Impact**:
- Backend uses `.single()` when querying documents
- Frontend assumes `uploaded_documents[0]` exists
- ⚠️ **RISK**: Schema allows multiple - could cause issues if multi-upload added

---

### 6. Storage Path is Local Filesystem
**Assumption**: `storage_path` in `uploaded_documents` is an absolute filesystem path.
**Why**: Current `storageService.js` uses local `fs` module, not Supabase Storage.
**Code Impact**:
- Only works in single-server deployment
- Will break in serverless/multi-instance deployment
- ⚠️ **CRITICAL for production**: Must migrate to Supabase Storage or S3

---

### 7. result_json Structure
**Assumption**: `result_json` in `analysis_results` has this structure:
```json
{
  "title": "string",
  "confidence": "string (mataas|katamtaman|mababa) or number",
  "ai_usage": "string",
  "summary": "string",
  "dimensions": { ... },
  "flags": [ ... ],
  "multimedia": [ ... ]
}
```
**Why**: Frontend expects these exact fields for rendering.
**Code Impact**:
- OpenAI/Gemini prompts must enforce this structure
- AI response validation should occur before INSERT
- Missing fields will cause frontend rendering issues

---

### 8. Column Name: `model_name` NOT `inference_model`
**Assumption**: The correct column in `analysis_results` is `model_name`.
**Why**: Schema defines `model_name text`.
**Code Impact**:
- ⚠️ **BUG**: `analysisWorker.js` uses `inference_model` - will fail
- Must be fixed to `model_name`

---

## Schema Gaps (Not Enforced by Database)

| Gap | Risk | Mitigation |
|-----|------|------------|
| No UNIQUE on `analysis_results.analysis_id` | Multiple results per analysis | Application logic uses `.single()` |
| No UNIQUE on `uploaded_documents.analysis_id` | Multiple docs per analysis | Application logic assumes one |
| No CHECK constraint on `status` values | Invalid status string | Handled by ENUM type ✓ |
| No `file_size` enforcement | Unlimited storage | Application enforces 50MB limit |
