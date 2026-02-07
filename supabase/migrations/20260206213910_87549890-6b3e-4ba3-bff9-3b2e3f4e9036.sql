-- Create crypto payment status enum
CREATE TYPE public.crypto_payment_status AS ENUM (
  'waiting',
  'confirming', 
  'confirmed',
  'sending',
  'partially_paid',
  'finished',
  'failed',
  'refunded',
  'expired'
);

-- Create crypto_payments table
CREATE TABLE public.crypto_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_id TEXT NOT NULL,
  payment_id TEXT,
  order_id TEXT NOT NULL,
  pay_address TEXT,
  pay_currency TEXT NOT NULL,
  pay_amount DECIMAL(20, 10),
  price_amount DECIMAL(12, 2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'LKR',
  actually_paid DECIMAL(20, 10),
  status public.crypto_payment_status NOT NULL DEFAULT 'waiting',
  outcome_amount DECIMAL(20, 10),
  outcome_currency TEXT,
  ipn_callback_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_crypto_payments_user_id ON public.crypto_payments(user_id);
CREATE INDEX idx_crypto_payments_invoice_id ON public.crypto_payments(invoice_id);
CREATE INDEX idx_crypto_payments_order_id ON public.crypto_payments(order_id);
CREATE INDEX idx_crypto_payments_status ON public.crypto_payments(status);

-- Enable RLS
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own crypto payments" 
ON public.crypto_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crypto payments" 
ON public.crypto_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto payments" 
ON public.crypto_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role can update any (for webhooks)
CREATE POLICY "Service role can update any crypto payments"
ON public.crypto_payments
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_crypto_payments_updated_at
BEFORE UPDATE ON public.crypto_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert NOWPayments settings into system_settings
INSERT INTO public.system_settings (key, value, is_secret, category, description) VALUES
('nowpayments_enabled', 'false', false, 'payment', 'Enable NOWPayments Crypto Gateway'),
('nowpayments_api_key', '', true, 'payment', 'NOWPayments API Key'),
('nowpayments_ipn_secret', '', true, 'payment', 'NOWPayments IPN Secret for webhooks'),
('nowpayments_sandbox', 'true', false, 'payment', 'Use NOWPayments sandbox mode')
ON CONFLICT (key) DO NOTHING;