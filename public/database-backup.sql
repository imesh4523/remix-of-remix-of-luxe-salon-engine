-- ============================================
-- FULL DATABASE BACKUP - Puso Salon Platform
-- Generated: 2026-02-07
-- ============================================

-- ============================================
-- 1. ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.crypto_payment_status AS ENUM ('waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired');
CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE public.salon_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit', 'refund', 'commission', 'payout', 'adjustment');

-- ============================================
-- 2. TABLES
-- ============================================

-- provinces
CREATE TABLE public.provinces (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- districts
CREATE TABLE public.districts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    province_id UUID NOT NULL REFERENCES public.provinces(id),
    name_en TEXT NOT NULL,
    name_si TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_districts_province_id ON public.districts(province_id);

-- towns
CREATE TABLE public.towns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    district_id UUID NOT NULL REFERENCES public.districts(id),
    name_en TEXT NOT NULL,
    name_si TEXT NOT NULL,
    postal_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_towns_district_id ON public.towns(district_id);

-- profiles
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    is_suspended BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    last_login_ip TEXT,
    registration_ip TEXT,
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'customer'
);
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles(user_id, role);

-- salons
CREATE TABLE public.salons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    email TEXT,
    cover_image TEXT,
    logo TEXT,
    status public.salon_status NOT NULL DEFAULT 'pending',
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    commission_rate NUMERIC DEFAULT 15,
    credit_limit NUMERIC DEFAULT 10000,
    credit_limit_orders INTEGER,
    orders_since_settlement INTEGER DEFAULT 0,
    platform_payable NUMERIC DEFAULT 0,
    trust_level TEXT DEFAULT 'standard',
    auto_frozen_at TIMESTAMPTZ,
    auto_freeze_reason TEXT,
    province_id UUID REFERENCES public.provinces(id),
    district_id UUID REFERENCES public.districts(id),
    town_id UUID REFERENCES public.towns(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_salons_owner_id ON public.salons(owner_id);
CREATE INDEX idx_salons_slug ON public.salons(slug);
CREATE INDEX idx_salons_status ON public.salons(status);

-- salon_images
CREATE TABLE public.salon_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- service_categories
CREATE TABLE public.service_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- services
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- staff
CREATE TABLE public.staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    user_id UUID,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- staff_services
CREATE TABLE public.staff_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX staff_services_staff_service_key ON public.staff_services(staff_id, service_id);

-- staff_availability
CREATE TABLE public.staff_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    day_of_week public.day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true
);

-- staff_shifts
CREATE TABLE public.staff_shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bookings
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id),
    staff_id UUID NOT NULL REFERENCES public.staff(id),
    service_id UUID NOT NULL REFERENCES public.services(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status public.booking_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    platform_commission NUMERIC NOT NULL,
    vendor_payout NUMERIC NOT NULL,
    notes TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    commission_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_commission_settled ON public.bookings(commission_settled);

-- reviews
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id),
    customer_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    is_hidden BOOLEAN DEFAULT false,
    hidden_by UUID,
    hidden_reason TEXT,
    admin_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- wallets
CREATE TABLE public.wallets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'LKR',
    is_frozen BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- wallet_transactions
CREATE TABLE public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    type public.wallet_transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    description TEXT,
    reference_id TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- commission_settlements
CREATE TABLE public.commission_settlements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id),
    booking_id UUID REFERENCES public.bookings(id),
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_commission_settlements_salon ON public.commission_settlements(salon_id);
CREATE INDEX idx_commission_settlements_type ON public.commission_settlements(type);

-- payout_requests
CREATE TABLE public.payout_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    amount NUMERIC NOT NULL,
    bank_details JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- crypto_payments
CREATE TABLE public.crypto_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    invoice_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    price_amount NUMERIC NOT NULL,
    price_currency TEXT NOT NULL DEFAULT 'USD',
    pay_currency TEXT NOT NULL,
    pay_amount NUMERIC,
    pay_address TEXT,
    payment_id TEXT,
    status public.crypto_payment_status NOT NULL DEFAULT 'waiting',
    actually_paid NUMERIC,
    outcome_amount NUMERIC,
    outcome_currency TEXT,
    ipn_callback_url TEXT,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crypto_payments_user_id ON public.crypto_payments(user_id);
CREATE INDEX idx_crypto_payments_invoice_id ON public.crypto_payments(invoice_id);
CREATE INDEX idx_crypto_payments_order_id ON public.crypto_payments(order_id);
CREATE INDEX idx_crypto_payments_status ON public.crypto_payments(status);

-- notification_preferences
CREATE TABLE public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    push_enabled BOOLEAN DEFAULT false,
    push_booking_updates BOOLEAN DEFAULT true,
    push_payment_updates BOOLEAN DEFAULT true,
    push_reminders BOOLEAN DEFAULT true,
    email_booking_confirm BOOLEAN DEFAULT true,
    email_booking_cancelled BOOLEAN DEFAULT true,
    email_booking_complete BOOLEAN DEFAULT true,
    email_booking_reminder BOOLEAN DEFAULT true,
    email_payment_received BOOLEAN DEFAULT true,
    email_promotions BOOLEAN DEFAULT false,
    sms_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- push_subscriptions
CREATE TABLE public.push_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_info JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions(endpoint);

-- email_logs
CREATE TABLE public.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resend_id TEXT,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_template_type ON public.email_logs(template_type);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- password_reset_codes
CREATE TABLE public.password_reset_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_code ON public.password_reset_codes(code);

-- activity_logs
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- support_tickets
CREATE TABLE public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status public.ticket_status NOT NULL DEFAULT 'open',
    priority public.ticket_priority NOT NULL DEFAULT 'medium',
    assigned_admin_id UUID,
    related_salon_id UUID REFERENCES public.salons(id),
    related_booking_id UUID REFERENCES public.bookings(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ticket_messages
CREATE TABLE public.ticket_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- system_settings
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. VIEWS
-- ============================================

CREATE VIEW public.public_profiles AS
SELECT id, user_id, full_name, avatar_url FROM profiles;

CREATE VIEW public.public_salons AS
SELECT id, name, description, address, city, phone, email, cover_image, logo, slug,
       rating, review_count, latitude, longitude, status, province_id, district_id,
       town_id, owner_id, created_at, updated_at
FROM salons WHERE status = 'approved'::salon_status;

-- ============================================
-- 4. FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.owns_salon(_user_id UUID, _salon_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.salons WHERE id = _salon_id AND owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_salon_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
    UPDATE public.salons SET
        rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE salon_id = NEW.salon_id),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE salon_id = NEW.salon_id)
    WHERE id = NEW.salon_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id) VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_booking_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  salon_record RECORD;
  owner_wallet_id UUID;
  current_balance NUMERIC;
  auto_freeze_setting TEXT;
  should_freeze BOOLEAN := FALSE;
  freeze_reason TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
    IF NEW.payment_method = 'cash' THEN
      UPDATE salons SET platform_payable = COALESCE(platform_payable, 0) + NEW.platform_commission,
          orders_since_settlement = COALESCE(orders_since_settlement, 0) + 1
      WHERE id = NEW.salon_id;
      SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
      SELECT value INTO auto_freeze_setting FROM system_settings WHERE key = 'auto_freeze_enabled';
      IF auto_freeze_setting = 'true' THEN
        IF salon_record.platform_payable > COALESCE(salon_record.credit_limit, 10000) THEN
          should_freeze := TRUE; freeze_reason := 'credit_limit_exceeded';
        END IF;
        IF salon_record.credit_limit_orders IS NOT NULL AND salon_record.credit_limit_orders > 0
           AND salon_record.orders_since_settlement >= salon_record.credit_limit_orders THEN
          should_freeze := TRUE; freeze_reason := 'order_limit_exceeded';
        END IF;
        IF should_freeze AND salon_record.status = 'approved' THEN
          UPDATE salons SET status = 'suspended', auto_frozen_at = NOW(), auto_freeze_reason = freeze_reason
          WHERE id = NEW.salon_id;
          INSERT INTO activity_logs (entity_type, entity_id, action, details)
          VALUES ('salon', NEW.salon_id, 'auto_freeze', jsonb_build_object(
            'reason', freeze_reason, 'platform_payable', salon_record.platform_payable,
            'credit_limit', salon_record.credit_limit, 'orders_since_settlement', salon_record.orders_since_settlement));
        END IF;
      END IF;
      INSERT INTO commission_settlements (salon_id, booking_id, amount, type, payment_method)
      VALUES (NEW.salon_id, NEW.id, NEW.platform_commission, 'commission_due', 'cash_at_salon');
      NEW.commission_settled := false;
    ELSE
      SELECT id, balance INTO owner_wallet_id, current_balance FROM wallets WHERE user_id = salon_record.owner_id;
      IF owner_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, balance, currency) VALUES (salon_record.owner_id, NEW.vendor_payout, 'LKR')
        RETURNING id, balance INTO owner_wallet_id, current_balance;
        INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, reference_id)
        VALUES (owner_wallet_id, 'credit', NEW.vendor_payout, 0, NEW.vendor_payout, 'Booking payment (commission deducted)', NEW.id);
      ELSE
        UPDATE wallets SET balance = balance + NEW.vendor_payout, updated_at = NOW() WHERE id = owner_wallet_id;
        INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, reference_id)
        VALUES (owner_wallet_id, 'credit', NEW.vendor_payout, current_balance, current_balance + NEW.vendor_payout, 'Booking payment (commission deducted)', NEW.id);
      END IF;
      INSERT INTO commission_settlements (salon_id, booking_id, amount, type, payment_method)
      VALUES (NEW.salon_id, NEW.id, NEW.platform_commission, 'commission_paid', 'online_payment');
      NEW.commission_settled := true;
      NEW.settled_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. RLS - Enable Row Level Security
-- ============================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- activity_logs
CREATE POLICY "Admins can view all logs" ON public.activity_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own logs" ON public.activity_logs FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'));

-- bookings
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING ((customer_id = auth.uid()) OR owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Stakeholders can update bookings" ON public.bookings FOR UPDATE USING ((customer_id = auth.uid()) OR owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));

-- commission_settlements
CREATE POLICY "Admins can manage settlements" ON public.commission_settlements FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view own salon settlements" ON public.commission_settlements FOR SELECT USING (owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));

-- crypto_payments
CREATE POLICY "Users can create their own crypto payments" ON public.crypto_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crypto payments" ON public.crypto_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own crypto payments" ON public.crypto_payments FOR SELECT USING (auth.uid() = user_id);

-- districts
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view districts" ON public.districts FOR SELECT USING (true);

-- email_logs
CREATE POLICY "Admins can view all email logs" ON public.email_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL) OR (auth.role() = 'service_role'));
CREATE POLICY "Users can view own email logs" ON public.email_logs FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

-- notification_preferences
CREATE POLICY "Admins can view all preferences" ON public.notification_preferences FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);

-- password_reset_codes
CREATE POLICY "Service role manages reset codes" ON public.password_reset_codes FOR ALL USING (auth.role() = 'service_role');

-- payout_requests
CREATE POLICY "Admins can manage payouts" ON public.payout_requests FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can request payouts" ON public.payout_requests FOR INSERT WITH CHECK (owns_salon(auth.uid(), salon_id));
CREATE POLICY "Vendors can view own payouts" ON public.payout_requests FOR SELECT USING (owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

-- provinces
CREATE POLICY "Admins can manage provinces" ON public.provinces FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);

-- push_subscriptions
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- reviews
CREATE POLICY "Anyone can view visible reviews" ON public.reviews FOR SELECT USING ((is_hidden = false) OR (customer_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- salon_images
CREATE POLICY "Anyone can view salon images" ON public.salon_images FOR SELECT USING (true);
CREATE POLICY "Owners can manage salon images" ON public.salon_images FOR ALL USING (owns_salon(auth.uid(), salon_id));

-- salons
CREATE POLICY "Anyone can view approved salons" ON public.salons FOR SELECT USING ((status = 'approved') OR (owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update own salon" ON public.salons FOR UPDATE USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create salons" ON public.salons FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can delete salons" ON public.salons FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- service_categories
CREATE POLICY "Admins can manage categories" ON public.service_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view categories" ON public.service_categories FOR SELECT USING (true);

-- services
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Owners can manage services" ON public.services FOR ALL USING (owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));

-- staff
CREATE POLICY "Anyone can view active staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Owners can manage staff" ON public.staff FOR ALL USING (owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'));

-- staff_availability
CREATE POLICY "Anyone can view availability" ON public.staff_availability FOR SELECT USING (true);
CREATE POLICY "Staff owners can manage availability" ON public.staff_availability FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND owns_salon(auth.uid(), s.salon_id)));

-- staff_services
CREATE POLICY "Anyone can view staff services" ON public.staff_services FOR SELECT USING (true);
CREATE POLICY "Owners can manage staff services" ON public.staff_services FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND owns_salon(auth.uid(), s.salon_id)));

-- staff_shifts
CREATE POLICY "Owners can manage shifts" ON public.staff_shifts FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND owns_salon(auth.uid(), s.salon_id)));
CREATE POLICY "Staff can view own shifts" ON public.staff_shifts FOR SELECT USING (true);

-- support_tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ticket_messages
CREATE POLICY "Ticket participants can view messages" ON public.ticket_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Ticket participants can send messages" ON public.ticket_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- system_settings
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view non-secret settings" ON public.system_settings FOR SELECT USING ((is_secret = false) OR has_role(auth.uid(), 'admin'));

-- towns
CREATE POLICY "Anyone can view towns" ON public.towns FOR SELECT USING (true);
CREATE POLICY "Admins can manage towns" ON public.towns FOR ALL USING (has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System can manage wallets" ON public.wallets FOR ALL USING (has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'));

-- wallet_transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND (w.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "System can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-assets', 'salon-assets', true);

-- ============================================
-- END OF BACKUP
-- ============================================
