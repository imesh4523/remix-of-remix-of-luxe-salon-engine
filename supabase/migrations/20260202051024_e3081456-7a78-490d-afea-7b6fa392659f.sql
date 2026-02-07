-- Add auth settings to system_settings
INSERT INTO public.system_settings (key, value, description, category, is_secret)
VALUES 
  ('auto_confirm_email', 'true', 'Auto-confirm email signups (skip verification)', 'security', false),
  ('allow_new_signups', 'true', 'Allow new user registrations', 'security', false)
ON CONFLICT (key) DO NOTHING;