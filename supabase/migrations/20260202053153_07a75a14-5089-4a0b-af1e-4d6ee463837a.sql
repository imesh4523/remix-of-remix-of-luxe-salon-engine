-- Add more comprehensive system settings
INSERT INTO public.system_settings (key, value, description, category, is_secret)
VALUES 
  -- Platform Settings
  ('platform_name', 'Glamour', 'Platform Display Name', 'platform', false),
  ('platform_tagline', 'Your Beauty Marketplace', 'Platform Tagline', 'platform', false),
  ('support_email', '', 'Support Email Address', 'platform', false),
  ('support_phone', '', 'Support Phone Number', 'platform', false),
  ('maintenance_mode', 'false', 'Enable Maintenance Mode', 'platform', false),
  ('min_payout_amount', '1000', 'Minimum Payout Request Amount (Rs.)', 'platform', false),
  
  -- Payment Gateway Settings
  ('payment_gateway', 'payhere', 'Active Payment Gateway (payhere/stripe)', 'payment', false),
  ('stripe_publishable_key', '', 'Stripe Publishable Key', 'payment', true),
  ('stripe_secret_key', '', 'Stripe Secret Key', 'payment', true),
  ('enable_online_payments', 'true', 'Enable Online Payments', 'payment', false),
  ('enable_cash_payments', 'true', 'Enable Cash on Arrival', 'payment', false),
  
  -- Security Settings
  ('max_login_attempts', '5', 'Maximum Login Attempts Before Lockout', 'security', false),
  ('session_timeout_hours', '24', 'Session Timeout (Hours)', 'security', false),
  ('require_strong_passwords', 'true', 'Require Strong Passwords', 'security', false),
  
  -- Business Rules
  ('cancellation_hours', '4', 'Hours Before Which Customer Can Cancel', 'platform', false),
  ('vendor_auto_approve', 'false', 'Auto-approve New Vendor Applications', 'platform', false),
  ('max_booking_per_day', '10', 'Maximum Bookings Per Customer Per Day', 'platform', false)
ON CONFLICT (key) DO NOTHING;