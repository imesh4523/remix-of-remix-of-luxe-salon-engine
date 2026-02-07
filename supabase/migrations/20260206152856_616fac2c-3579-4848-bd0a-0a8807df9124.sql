-- Insert SMTP/Email settings into system_settings table
INSERT INTO public.system_settings (key, value, is_secret, category, description) VALUES
  ('email_provider', 'smtp', false, 'email', 'Email Provider (smtp or resend)'),
  ('smtp_host', '', false, 'email', 'SMTP Server Host'),
  ('smtp_port', '587', false, 'email', 'SMTP Server Port'),
  ('smtp_username', '', true, 'email', 'SMTP Username'),
  ('smtp_password', '', true, 'email', 'SMTP Password'),
  ('smtp_from_email', 'noreply@yourdomain.com', false, 'email', 'From Email Address'),
  ('smtp_from_name', 'Salon Booking', false, 'email', 'From Name'),
  ('smtp_secure', 'true', false, 'email', 'Use TLS/SSL'),
  ('resend_api_key', '', true, 'email', 'Resend API Key')
ON CONFLICT (key) DO NOTHING;