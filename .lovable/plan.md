

# Push Notification System - Full Implementation

## Current Status

**Already done:**
- `push_subscriptions` table exists with RLS policies (endpoint, p256dh_key, auth_key, device_info, is_active)
- `notification_preferences` table has push columns: `push_enabled`, `push_booking_updates`, `push_reminders`, `push_payment_updates`
- PWA setup with `vite-plugin-pwa` (service worker via Workbox)
- `send-email` edge function already working

**Not yet built:**
- `send-push` edge function
- `usePushSubscription` hook (subscribe/unsubscribe)
- `useNotificationPreferences` hook (load/save from DB)
- Notifications.tsx database integration
- Service worker push event listener

---

## Implementation Steps

### Step 1: Service Worker Push Handler
Add a custom service worker file that listens for `push` events and shows native notifications. The PWA plugin will inject this alongside the existing Workbox service worker.

**New file:** `public/sw-push.js`
- Listen for `push` event, parse payload, show notification with title/body/icon/URL
- Listen for `notificationclick` to open the app at the right page

### Step 2: Update PWA Config
Modify `vite.config.ts` to import the custom push service worker alongside the auto-generated Workbox one using `importScripts`.

### Step 3: Send Push Edge Function
**New file:** `supabase/functions/send-push/index.ts`

- Accept: `{ userId, title, body, url, data }`
- Fetch user's `notification_preferences` to check if push is enabled
- Fetch all active `push_subscriptions` for that user
- Use the Web Push protocol (with VAPID keys stored as secrets) to send to each subscription endpoint
- Remove invalid subscriptions (410 Gone responses)
- Support batch sending (to multiple users)

**Required secrets:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (email)

### Step 4: Push Subscription Hook
**New file:** `src/hooks/usePushSubscription.ts`

- `subscribeToPush()`: Request notification permission, get PushSubscription from service worker, save endpoint + keys to `push_subscriptions` table
- `unsubscribeFromPush()`: Unsubscribe from browser + deactivate in DB
- `isSubscribed`: Check if current device has active subscription
- Uses the VAPID public key (exposed via env variable `VITE_VAPID_PUBLIC_KEY`)

### Step 5: Notification Preferences Hook
**New file:** `src/hooks/useNotificationPreferences.ts`

- Load preferences from `notification_preferences` table for current user
- Update individual preference toggles
- Auto-create default preferences if none exist

### Step 6: Update Notifications Page
**Modify:** `src/pages/Notifications.tsx`

- Replace local `useState` with `useNotificationPreferences` hook
- Map toggles to actual DB columns (email_booking_confirm, push_enabled, etc.)
- Add push subscribe/unsubscribe button using `usePushSubscription`
- Show permission status (granted/denied/default)
- More granular controls matching DB columns

---

## Technical Details

### VAPID Keys
Web Push requires VAPID (Voluntary Application Server Identification) keys. These need to be generated once and stored as secrets:
- `VAPID_PUBLIC_KEY` - shared with frontend (also add as `VITE_VAPID_PUBLIC_KEY` in .env)
- `VAPID_PRIVATE_KEY` - only in edge function secrets
- `VAPID_SUBJECT` - mailto: URL like `mailto:noreply@salonbooking.lk`

### Push Payload Format
```text
{
  "title": "Booking Confirmed",
  "body": "Your appointment at Glamour Salon is confirmed for Feb 10 at 2:00 PM",
  "icon": "/pwa-192x192.png",
  "url": "/bookings"
}
```

### Preference Check Map for Push
| Push Preference Column | Triggers |
|---|---|
| push_booking_updates | booking_confirmed, booking_cancelled, new_booking_alert |
| push_reminders | booking_reminder |
| push_payment_updates | payment_received, payout_processed |

### Files Summary

| Action | File | Purpose |
|---|---|---|
| Create | `public/sw-push.js` | Service worker push event handler |
| Create | `supabase/functions/send-push/index.ts` | Edge function to send push via Web Push API |
| Create | `src/hooks/usePushSubscription.ts` | Browser push subscribe/unsubscribe |
| Create | `src/hooks/useNotificationPreferences.ts` | DB preferences CRUD |
| Modify | `src/pages/Notifications.tsx` | Connect to DB, add push subscribe UI |
| Modify | `vite.config.ts` | Import custom SW for push |

