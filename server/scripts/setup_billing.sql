-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT NOT NULL, -- 'free', 'pro_monthly', 'pro_annual'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    payment_provider_id TEXT, -- e.g., 'sub_12345'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'card', 'gcash', 'paypal'
    provider_token TEXT, -- Token from Stripe/PayMongo
    last4 TEXT,
    brand TEXT, -- 'visa', 'mastercard', 'gcash'
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PHP',
    status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
    description TEXT,
    pdf_url TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    payment_method_id UUID REFERENCES payment_methods(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BILLING LOGS (Audit Trail)
CREATE TABLE IF NOT EXISTS billing_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    action TEXT NOT NULL, -- 'subscription_created', 'payment_failed'
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simplified for now - Supabase Auth)
-- Create policies if they don't exist (using DO block to avoid errors if they exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscription'
    ) THEN
        CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Users can view own payment methods'
    ) THEN
        CREATE POLICY "Users can view own payment methods" ON payment_methods FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view own invoices'
    ) THEN
        CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
END
$$;
