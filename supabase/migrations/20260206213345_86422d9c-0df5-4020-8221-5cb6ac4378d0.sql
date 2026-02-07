-- Add Google OAuth settings to system_settings table
INSERT INTO system_settings (key, value, is_secret, category, description) VALUES
('google_oauth_enabled', 'true', false, 'security', 'Enable Google Sign-In for users'),
('google_client_id', '', true, 'security', 'Google OAuth Client ID from Google Cloud Console'),
('google_client_secret', '', true, 'security', 'Google OAuth Client Secret from Google Cloud Console')
ON CONFLICT (key) DO NOTHING;