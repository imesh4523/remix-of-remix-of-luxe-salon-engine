-- Add credit limit columns to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 10000;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS credit_limit_orders INTEGER;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'new';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS orders_since_settlement INTEGER DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_frozen_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_freeze_reason TEXT;

-- Add credit limit related system settings
INSERT INTO system_settings (key, value, category, description, is_secret) VALUES
('default_credit_limit_new', '5000', 'platform', 'Credit limit for new salons (Rs.)', false),
('default_credit_limit_standard', '10000', 'platform', 'Credit limit for standard salons (Rs.)', false),
('default_credit_limit_trusted', '25000', 'platform', 'Credit limit for trusted salons (Rs.)', false),
('default_credit_limit_premium', '50000', 'platform', 'Credit limit for premium salons (Rs.)', false),
('default_order_settlement_limit', '0', 'platform', 'Settlement required after X orders (0=disabled)', false),
('auto_freeze_enabled', 'true', 'platform', 'Auto-freeze salons on credit limit breach', false)
ON CONFLICT (key) DO NOTHING;