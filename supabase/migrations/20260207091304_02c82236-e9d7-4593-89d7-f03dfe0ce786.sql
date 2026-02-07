
-- Fix security definer views - use security_invoker instead
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.public_salons;

CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
  SELECT id, user_id, full_name, avatar_url
  FROM public.profiles;

CREATE VIEW public.public_salons
WITH (security_invoker=on) AS
  SELECT id, name, description, address, city, phone, email, 
         cover_image, logo, slug, rating, review_count, 
         latitude, longitude, status, province_id, district_id, town_id, owner_id,
         created_at, updated_at
  FROM public.salons
  WHERE status = 'approved';
