# Database Triggers Documentation

## Active Triggers

### 1. `on_auth_user_created`
**Table**: `auth.users`
**Event**: AFTER INSERT
**Function**: `public.handle_new_user()`

**Behavior**:
```sql
INSERT INTO public.users (id, email, full_name)
VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
```

**Implications for Application Code**:
- Do NOT manually insert into `public.users` - the trigger handles this
- User records are created automatically when a user signs up via Supabase Auth
- The `full_name` is extracted from `raw_user_meta_data` - ensure frontend passes this during signup

---

### 2. `update_analyses_updated_at`
**Table**: `public.analyses`
**Event**: BEFORE UPDATE
**Function**: `update_updated_at_column()`

**Behavior**:
```sql
new.updated_at = now();
```

**Implications for Application Code**:
- Do NOT manually set `updated_at` in UPDATE statements - it will be overwritten
- The backend code currently sets `updated_at` manually (redundant but harmless)
- This ensures `updated_at` is always accurate even if code forgets to set it

---

### 3. `enforce_results_immutability` ⚠️ CRITICAL
**Table**: `public.analysis_results`
**Event**: BEFORE UPDATE
**Function**: `prevent_audit_results_update()`

**Behavior**:
```sql
RAISE EXCEPTION 'Audit results are immutable and cannot be modified once persisted.';
```

**Implications for Application Code**:
- **NEVER attempt to UPDATE analysis_results** - it will always fail
- Results must be correct on first INSERT - no corrections possible
- If a result needs to be "corrected", create a new analysis entirely
- This is a compliance requirement: audit trails must be immutable

---

## Trigger Execution Order

1. User signs up → `on_auth_user_created` creates `public.users` record
2. Analysis created → No trigger (just INSERT)
3. Analysis updated → `update_analyses_updated_at` updates timestamp
4. Result inserted → No trigger (just INSERT)
5. Result update attempted → `enforce_results_immutability` blocks it

---

## Functions Summary

| Function | Purpose | Security |
|----------|---------|----------|
| `handle_new_user()` | Sync auth.users to public.users | SECURITY DEFINER |
| `update_updated_at_column()` | Auto-timestamp on update | LANGUAGE plpgsql |
| `prevent_audit_results_update()` | Block result modifications | LANGUAGE plpgsql |
