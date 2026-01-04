-- Add UNIQUE constraint to enforce one subscription per user
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
