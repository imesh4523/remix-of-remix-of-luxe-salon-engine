-- Add payment columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payment_method text NOT NULL DEFAULT 'cash',
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN paid_at timestamp with time zone;

-- Add constraint for valid payment method values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IN ('cash', 'online'));

-- Add constraint for valid payment status values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));