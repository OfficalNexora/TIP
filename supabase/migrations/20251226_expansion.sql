-- UNESCO AI Mirror: Institutional Expansion Schema
-- Purpose: Support User Settings and Subscription Persistence
-- This file defines the required schema updates requested during Phase 3 Audit.

-- 1. ADD COLUMNS TO USERS TABLE
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "theme": "light",
  "notifications": true,
  "retention_days": 30
}'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. CREATE SETTINGS UPDATE FUNCTION (Optional helper)
CREATE OR REPLACE FUNCTION public.update_user_settings(user_id UUID, new_settings JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET settings = users.settings || new_settings
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS UPDATES FOR SETTINGS
-- (Implicitly covered by "Users can view their own profile")
-- Add Update policy for settings
DROP POLICY IF EXISTS "Users can update their own settings." ON public.users;
CREATE POLICY "Users can update their own settings."
  ON public.users FOR UPDATE
  USING ( auth.uid() = id );
