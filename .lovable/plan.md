
# 📧📲 Notification & Email System (SMTP Based) - Updated Plan

## ✅ Already Completed
- Database tables: `notification_preferences`, `push_subscriptions`, `email_logs` with RLS policies
- Auto-create notification preferences trigger on profile creation

## 🎯 Remaining Implementation

### Phase 1: Email Templates (13 Unique Designs)
`src/lib/email-templates.ts` file එකක් create කරලා beautifully designed HTML templates 13ක් add කරනවා.

| # | Template | Recipient | Event |
|---|----------|-----------|-------|
| 1 | Welcome | Customer | Account create |
| 2 | Booking Confirmed | Customer | New booking |
| 3 | Booking Reminder | Customer | 24h before |
| 4 | Booking Completed | Customer | Service done |
| 5 | Booking Cancelled | Customer | Cancel |
| 6 | Payment Received | Customer | Payment success |
| 7 | Payment Refunded | Customer | Refund |
| 8 | New Booking Alert | Salon Owner | New booking received |
| 9 | Booking Cancelled Alert | Salon Owner | Customer cancel |
| 10 | Daily Summary | Salon Owner | Daily report |
| 11 | Payout Processed | Salon Owner | Payout done |
| 12 | Account Frozen | Salon Owner | Credit limit exceeded |
| 13 | Account Unfrozen | Salon Owner | Freeze removed |

**Design:**
- Brand: salonbooking.lk
- Colors: Gold (#D4A574), Dark (#141516)
- Responsive HTML email design
- Each template unique icons/styling

---

### Phase 2: Send Email Edge Function (SMTP)
`supabase/functions/send-email/index.ts` - Centralized email sender using SMTP

**Features:**
- Template selection based on `type` parameter
- SMTP settings read from `system_settings` table (existing setup)
- Auto-logging to `email_logs` table
- Check user preferences before sending

```text
Request Body:
{
  "to": "customer@email.com",
  "type": "booking_confirmed",
  "data": {
    "customerName": "John",
    "salonName": "Glamour Salon",
    "serviceName": "Haircut",
    "date": "2024-02-10",
    "time": "2:00 PM",
    "total": 2500
  }
}
```

---

### Phase 3: Send Push Notification Edge Function
`supabase/functions/send-push/index.ts` - Web Push notifications

**Features:**
- Web Push API (VAPID keys auto-generated)
- Send to specific user or batch
- Check push preferences before sending

---

### Phase 4: Booking Reminders (Cron Job)
`supabase/functions/booking-reminders/index.ts`

**Logic:**
- Run every hour
- Find bookings 24h away
- Send reminder email + push to customer
- Mark as reminded (prevent duplicates)

---

### Phase 5: Daily Summary (Cron Job)
`supabase/functions/daily-summary/index.ts`

**Logic:**
- Run daily 6 AM
- For each salon owner:
  - Count today's bookings
  - Calculate revenue
  - Send summary email

---

### Phase 6: Frontend Integration

**Update `src/pages/Notifications.tsx`:**
- Load/save preferences from database
- Connect to `notification_preferences` table

**New hook `src/hooks/useNotificationPreferences.ts`:**
- CRUD operations for preferences

**New hook `src/hooks/usePushSubscription.ts`:**
- Subscribe/unsubscribe push notifications
- Request permission

---

### Phase 7: Integration Triggers

**Update existing code to trigger emails:**

| Event | Email To | Push To |
|-------|----------|---------|
| User signup | Customer (Welcome) | - |
| Booking created | Customer + Owner | Owner |
| Booking completed | Customer | Customer |
| Booking cancelled | Customer + Owner | Both |
| Payment received | Customer | Customer |
| Salon frozen | Owner | Owner |
| Salon unfrozen | Owner | Owner |

---

## 📁 New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/email-templates.ts` | 13 HTML email templates |
| `supabase/functions/send-email/index.ts` | SMTP email sender |
| `supabase/functions/send-push/index.ts` | Web Push sender |
| `supabase/functions/booking-reminders/index.ts` | Cron: 24h reminders |
| `supabase/functions/daily-summary/index.ts` | Cron: daily reports |
| `src/hooks/useNotificationPreferences.ts` | Preferences hook |
| `src/hooks/usePushSubscription.ts` | Push subscription hook |

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Notifications.tsx` | Database integration |
| `src/hooks/useData.ts` | Trigger emails on booking |
| `supabase/config.toml` | Add cron schedules |

---

## ⚙️ SMTP Setup (Admin Dashboard වලින් කරන්න)

Admin Dashboard → Email tab:
1. SMTP Host: `mail.salonbooking.lk` (or your provider)
2. SMTP Port: `587`
3. SMTP Username: `noreply@salonbooking.lk`
4. SMTP Password: `[your password]`
5. From Email: `noreply@salonbooking.lk`
6. From Name: `SalonBooking.lk`

**API key ඕනෑ නෑ** - Admin dashboard එකෙන් SMTP configure කරනවා!

---

## 🎨 Email Template Preview

```text
╔═══════════════════════════════════════════════════════════╗
║                    SALONBOOKING.LK                         ║
║            ✨ Your Beauty Destination ✨                    ║
╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────┐
│                                                           │
│              ✅ BOOKING CONFIRMED!                        │
│                                                           │
│  Hi [Customer Name],                                      │
│                                                           │
│  Your appointment is confirmed!                           │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📍 Glamour Beauty Salon                            │ │
│  │  ✂️ Haircut & Styling                               │ │
│  │  👤 Nimal Perera                                    │ │
│  │  📅 Feb 10, 2024 at 2:00 PM                         │ │
│  │  💰 Rs. 2,500                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│        [📱 ADD TO CALENDAR]  [🗺️ GET DIRECTIONS]         │
│                                                           │
└───────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────
© 2024 SalonBooking.lk | Colombo, Sri Lanka
Unsubscribe | Privacy Policy
```

---

## Technical Notes

1. **SMTP Library**: `denomailer` (already used in send-reset-code)
2. **Push Notifications**: Web Push API with VAPID keys
3. **Cron Jobs**: Edge function scheduling via config.toml
4. **Preference Checking**: Always check user preferences before sending

