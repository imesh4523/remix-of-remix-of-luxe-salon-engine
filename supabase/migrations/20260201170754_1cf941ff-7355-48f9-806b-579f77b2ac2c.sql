-- Create system_settings table for storing API keys and configurations
CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value text,
    is_secret boolean DEFAULT false,
    category text NOT NULL DEFAULT 'general',
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage settings
CREATE POLICY "Admins can manage all settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings structure
INSERT INTO public.system_settings (key, value, is_secret, category, description) VALUES
-- PayHere Settings
('payhere_merchant_id', '', true, 'payment', 'PayHere Merchant ID'),
('payhere_merchant_secret', '', true, 'payment', 'PayHere Merchant Secret'),
('payhere_sandbox_mode', 'true', false, 'payment', 'Enable PayHere Sandbox Mode'),
-- Email Settings
('smtp_host', '', false, 'email', 'SMTP Server Host'),
('smtp_port', '587', false, 'email', 'SMTP Server Port'),
('smtp_username', '', false, 'email', 'SMTP Username'),
('smtp_password', '', true, 'email', 'SMTP Password'),
('smtp_from_email', '', false, 'email', 'From Email Address'),
('smtp_from_name', 'Salon Booking', false, 'email', 'From Name'),
('resend_api_key', '', true, 'email', 'Resend API Key (alternative to SMTP)'),
('email_provider', 'smtp', false, 'email', 'Email Provider (smtp or resend)'),
-- Platform Settings
('platform_commission_rate', '15', false, 'platform', 'Default Platform Commission Rate (%)'),
('booking_advance_days', '30', false, 'platform', 'How many days in advance bookings allowed'),
('min_booking_notice_hours', '2', false, 'platform', 'Minimum hours notice for booking'),
('allow_vendor_registration', 'true', false, 'platform', 'Allow new vendor registrations'),
('require_email_verification', 'true', false, 'platform', 'Require email verification for new users'),
-- Notification Settings
('send_booking_confirmation', 'true', false, 'notifications', 'Send booking confirmation emails'),
('send_booking_reminder', 'true', false, 'notifications', 'Send booking reminder emails'),
('reminder_hours_before', '24', false, 'notifications', 'Hours before booking to send reminder'),
('send_vendor_notifications', 'true', false, 'notifications', 'Send notifications to vendors');

-- Add registration_ip column to profiles for tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_reason text;