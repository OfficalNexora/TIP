const { supabase } = require('../services/supabaseClient');

const initBillingTables = async () => {
    console.log('🔄 Initializing Billing Database Schema...');

    const schemaSQL = `
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
    -- Allow users to view their own data
    CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can view own payment methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
    `;

    try {
        // We can't run raw SQL easily via supabase-js client unless we use rpc() or have direct connection.
        // However, for this environment, we might rely on the user running it or using a workaround.
        // CHECK IF we have a direct pg connection or if we have to use the 'query' function if exposed?
        // Since I see 'check_db.js', let's see how they do it. 
        // NOTE: Standard supabase-js client DOES NOT support running raw SQL.

        console.log('⚠️  Standard Supabase client cannot run raw DDL/SQL.');
        console.log('👉 Please execute the SQL above in your Supabase SQL Editor to create the tables.');

        // However, we can TRY to create via table creation if they didn't exist, but that's hard with JS client.
        // Mocking success here assumes I will ask the user to run it or it's already there.
        // actually, I'll check if tables exist by querying them.

        const { error } = await supabase.from('subscriptions').select('id').limit(1);
        if (error && error.code === '42P01') { // undefined_table
            console.error('❌ Billing tables do not exist. Please run the migration SQL.');
        } else {
            console.log('✅ subscriptions table exists (or accessible).');
        }

    } catch (err) {
        console.error('Setup failed:', err);
    }
};

initBillingTables();
