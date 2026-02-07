
-- Step 1: Fix profiles access - hide personal data from public
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Create a public view for minimal profile info (for showing names in reviews etc.)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, user_id, full_name, avatar_url
  FROM public.profiles;

-- Step 2: Create public salons view (hide financial data)
CREATE OR REPLACE VIEW public.public_salons AS
  SELECT id, name, description, address, city, phone, email, 
         cover_image, logo, slug, rating, review_count, 
         latitude, longitude, status, province_id, district_id, town_id, owner_id,
         created_at, updated_at
  FROM public.salons
  WHERE status = 'approved';

-- Step 5: Fix reviews visibility - hide hidden reviews from public
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Anyone can view visible reviews"
  ON public.reviews FOR SELECT
  USING (
    (is_hidden IS NOT TRUE)
    OR customer_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Step 6: Password reset codes - service role only (no user access)
CREATE POLICY "Service role manages reset codes"
  ON public.password_reset_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Step 7: Activity logs - validate user_id on insert
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;

CREATE POLICY "Users can insert own logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
