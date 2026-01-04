# Supabase Folder Specification

## Purpose
This `/supabase` folder serves as the **canonical reference** for all database-related documentation. It does NOT contain executable migrations or schema changes — those are managed directly in Supabase Dashboard. This folder exists for developer reference and compliance auditing only.

## Required Files

### 1. `schema.sql` (Reference Only)
**What it represents**: A snapshot of the production Supabase schema.
**Why it exists**: Developers must reference this before writing any backend code.
**How to use**: Read-only. Do NOT apply this file directly. If schema changes are needed, they must be made via Supabase Dashboard and this file updated to reflect the change.

### 2. `policies.md`
**What it represents**: Complete documentation of all Row Level Security (RLS) policies.
**Why it exists**: Frontend and backend developers must understand ownership boundaries.
**How to use**: Before writing any query, verify that RLS allows the operation for the target user context.

### 3. `rls-summary.md`
**What it represents**: A simplified matrix of what operations each role can perform.
**Why it exists**: Quick reference for code reviews and security audits.
**How to use**: During PR review, verify all Supabase calls comply with this matrix.

### 4. `triggers.md`
**What it represents**: Documentation of all database triggers and their behavior.
**Why it exists**: Backend logic must not duplicate or conflict with trigger logic.
**How to use**: Before implementing status transitions or timestamp updates in code, check if a trigger already handles it.

### 5. `assumptions.md`
**What it represents**: Documented assumptions about schema behavior that affect application code.
**Why it exists**: Prevents future developers from making incorrect assumptions.
**How to use**: Read before modifying any analysis/document lifecycle code.

## Directory Structure
```
/supabase/
├── schema.sql           # Production schema snapshot (READ-ONLY)
├── policies.md          # RLS policy documentation
├── rls-summary.md       # Quick-reference permission matrix
├── triggers.md          # Trigger documentation
└── assumptions.md       # Schema behavior assumptions
```

## Enforcement Rules
1. **Never modify schema.sql directly** — update Supabase Dashboard first
2. **All backend PRs must reference this folder** in their description
3. **Any schema discrepancy found** during development must be immediately escalated
4. **This folder is the source of truth** after the actual Supabase database
