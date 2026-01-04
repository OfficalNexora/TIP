-- Create a table to track usage counts immutably 
-- (Deleting an analysis should NOT lower the usage count)

CREATE TABLE IF NOT EXISTS scan_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE scan_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own logs (for transparency if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'scan_usage_logs' AND policyname = 'Users can view own usage logs'
    ) THEN
        CREATE POLICY "Users can view own usage logs" ON scan_usage_logs FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
END
$$;

-- Allow service role (backend) to insert/manage everything (implicit)
