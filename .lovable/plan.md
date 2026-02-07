

# Maximum Security Hardening Plan

Site එකට ගොඩක් users එනවා නම් security එක 100% important. Security scan එකෙන් **critical vulnerabilities 4ක්** සහ **warnings 4ක්** හම්බ වුණා. මේ plan එකෙන් ඒ හැම එකක්ම fix කරනවා + extra protection layers add කරනවා.

---

## Critical Issues Found (RED - Must Fix)

1. **Profiles table එකේ personal data (phone, IP, name) කාටත් පේනවා** - hacker කෙනෙකුට users ගේ phone numbers scrape කරන්න පුළුවන්
2. **Salons table එකේ financial data (commission rates, credit limits) expose වෙනවා** - competitors ට business secrets බලන්න පුළුවන්
3. **Email logs table එකේ email addresses leak වෙනවා** - spam attacks වලට use කරන්න පුළුවන්
4. **Payout requests table එකේ bank details expose වෙනවා** - financial fraud risk

---

## Implementation Steps

### Step 1: Profiles Table - Lock Down Personal Data
Current policy: `USING condition: true` (කාටත් බලන්න පුළුවන්!)

Fix: Users ට own profile එක + basic public info (name, avatar) only බලන්න දෙනවා. Phone, IP, suspension details hide කරනවා.

- Drop "Users can view all profiles" policy
- Create new policy: authenticated users can see own full profile
- Create new policy: public can only see id, full_name, avatar_url via a database view

### Step 2: Salons Table - Hide Financial Columns
Current policy: Anyone can view approved salons (including commission_rate, credit_limit, platform_payable, trust_level)

Fix: Create a `public_salons` view that exposes only public columns (name, description, address, city, rating, review_count, cover_image, logo, slug, phone, email, latitude, longitude). Financial columns hidden.

### Step 3: Email Logs - Restrict Access
Fix: Ensure users can ONLY see their own email logs. Remove the ability for arbitrary authenticated users to insert logs (only service_role should insert).

### Step 4: Payout Requests - Restrict Bank Details
Fix: Bank details should only be visible to the specific wallet owner and admins, not all salon staff.

### Step 5: Reviews - Hide Hidden Reviews
Fix: Update "Anyone can view reviews" policy to filter out `is_hidden = true` reviews from public view.

### Step 6: Password Reset Codes - Add Policies
Fix: This table has RLS enabled but NO policies. Add appropriate policies so the password reset flow works via service_role only.

### Step 7: Activity Logs - Validate User ID on Insert
Fix: Ensure users can only insert logs with their own user_id, preventing impersonation.

### Step 8: Edge Functions - Add JWT Verification
Current `config.toml` has NO `verify_jwt` settings. All edge functions are potentially open.

Fix: Add `verify_jwt = false` to config.toml for each function and implement manual JWT verification using `getClaims()` in the edge functions that need auth protection (send-push, create-crypto-invoice, check-crypto-payment, get-route-info). Keep webhook functions (nowpayments-webhook) public but validate signatures.

### Step 9: Rate Limiting on Auth
Add client-side rate limiting on login attempts to prevent brute force attacks.

---

## Technical Details

### Database Migration SQL (Step 1-7)

```text
-- Step 1: Fix profiles access
DROP POLICY "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Create a public view for minimal profile info (for showing names in reviews etc.)
CREATE VIEW public_profiles AS
  SELECT id, user_id, full_name, avatar_url
  FROM profiles;

-- Step 2: Create public salons view (hide financial data)
CREATE VIEW public_salons AS
  SELECT id, name, description, address, city, phone, email, 
         cover_image, logo, slug, rating, review_count, 
         latitude, longitude, status, province_id, district_id, town_id, owner_id
  FROM salons
  WHERE status = 'approved';

-- Step 5: Fix reviews visibility
DROP POLICY "Anyone can view reviews" ON reviews;

CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT
  USING (
    is_hidden = false 
    OR customer_id = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Step 6: Password reset codes - service role only
CREATE POLICY "Service role manages reset codes"
  ON password_reset_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Step 7: Activity logs - validate user_id
DROP POLICY "Authenticated users can insert logs" ON activity_logs;

CREATE POLICY "Users can insert own logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
```

### Edge Function Config (Step 8)
Update `supabase/config.toml`:
```text
[functions.send-push]
verify_jwt = false

[functions.create-crypto-invoice]
verify_jwt = false

[functions.check-crypto-payment]
verify_jwt = false

[functions.get-route-info]
verify_jwt = false

[functions.send-email]
verify_jwt = false

[functions.send-reset-code]
verify_jwt = false

[functions.verify-reset-code]
verify_jwt = false

[functions.create-test-admin]
verify_jwt = false

[functions.nowpayments-webhook]
verify_jwt = false
```

Then add `getClaims()` JWT validation to protected edge functions.

### Client-Side Rate Limiting (Step 9)
Add login attempt tracking with lockout after 5 failed attempts in 15 minutes.

### Files to Modify/Create

| Action | File | Purpose |
|--------|------|---------|
| Modify | Database migration | Fix 7 RLS policies |
| Modify | supabase/config.toml | JWT verification settings |
| Modify | supabase/functions/send-push/index.ts | Add getClaims() auth |
| Modify | supabase/functions/create-crypto-invoice/index.ts | Add getClaims() auth |
| Modify | supabase/functions/check-crypto-payment/index.ts | Add getClaims() auth |
| Modify | supabase/functions/get-route-info/index.ts | Add getClaims() auth |
| Modify | supabase/functions/send-email/index.ts | Add getClaims() auth |
| Modify | src/pages/Auth.tsx | Add rate limiting |
| Modify | src/hooks/useAuth.tsx | Add rate limiting logic |
| Create | src/components/admin/SecurityDashboard.tsx | Security monitoring view (optional) |

