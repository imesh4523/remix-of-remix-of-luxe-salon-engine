-- Phase 1 Database Migrations

-- 1. Add display_order and is_active to service_categories
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add moderation fields to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS hidden_by UUID,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- 3. Create index for better query performance on bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden ON public.reviews(is_hidden);