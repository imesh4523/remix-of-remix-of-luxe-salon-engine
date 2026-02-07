// ============================================
// SalonBooking.lk - Email Templates (13 Types)
// ============================================

interface TemplateData {
  [key: string]: any;
}

// Shared styles & layout
const brandColors = {
  gold: '#D4A574',
  goldLight: '#E8C9A8',
  dark: '#141516',
  darkGray: '#1E1F20',
  lightGray: '#F5F0EB',
  white: '#FFFFFF',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
  orange: '#F59E0B',
};

const baseLayout = (title: string, icon: string, content: string, footerExtra = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${brandColors.lightGray};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brandColors.lightGray};padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${brandColors.dark},${brandColors.darkGray});border-radius:16px 16px 0 0;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:${brandColors.gold};letter-spacing:1px;">SALONBOOKING.LK</h1>
              <p style="margin:6px 0 0;font-size:13px;color:${brandColors.goldLight};letter-spacing:2px;">✨ Your Beauty Destination ✨</p>
            </td>
          </tr>
          <!-- Icon Banner -->
          <tr>
            <td style="background-color:${brandColors.white};padding:30px 40px 10px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">${icon}</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:${brandColors.white};padding:10px 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${brandColors.dark};border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              ${footerExtra}
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} SalonBooking.lk | Colombo, Sri Lanka</p>
              <p style="margin:8px 0 0;font-size:11px;color:#666;">
                <a href="https://salonbooking.lk/settings" style="color:${brandColors.goldLight};text-decoration:none;">Unsubscribe</a> · 
                <a href="https://salonbooking.lk/privacy" style="color:${brandColors.goldLight};text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const infoBox = (items: { icon: string; label: string; value: string }[]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColors.lightGray};border-radius:12px;padding:20px;margin:16px 0;">
    ${items.map(i => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#666;width:30px;vertical-align:top;">${i.icon}</td>
      <td style="padding:6px 0;font-size:14px;color:#333;"><strong>${i.label}:</strong> ${i.value}</td>
    </tr>`).join('')}
  </table>`;

const actionButton = (text: string, url: string, color = brandColors.gold) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
    <tr>
      <td style="background-color:${color};border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;color:${brandColors.white};font-size:15px;font-weight:600;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;

// ============ TEMPLATE FUNCTIONS ============

// 1. Welcome
export function welcomeEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: 'Welcome to SalonBooking.lk! 🎉',
    html: baseLayout('Welcome', '👋', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 16px;">Welcome, ${data.customerName || 'there'}!</h2>
      <p style="color:#555;text-align:center;font-size:15px;line-height:1.6;">
        We're thrilled to have you join SalonBooking.lk — Sri Lanka's premier salon booking platform.
        Discover top salons, book appointments instantly, and enjoy a seamless beauty experience.
      </p>
      ${actionButton('Explore Salons', 'https://salonbooking.lk/explore')}
      <p style="color:#999;text-align:center;font-size:13px;">Start by browsing salons near you!</p>
    `),
  };
}

// 2. Booking Confirmed
export function bookingConfirmedEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed ✅ - ${data.salonName}`,
    html: baseLayout('Booking Confirmed', '✅', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 8px;">Booking Confirmed!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, your appointment is all set.</p>
      ${infoBox([
        { icon: '📍', label: 'Salon', value: data.salonName || '' },
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '👤', label: 'Stylist', value: data.staffName || 'Any available' },
        { icon: '📅', label: 'Date', value: data.date || '' },
        { icon: '🕐', label: 'Time', value: data.time || '' },
        { icon: '💰', label: 'Total', value: `Rs. ${Number(data.total || 0).toLocaleString()}` },
      ])}
      ${actionButton('View Booking', `https://salonbooking.lk/bookings`)}
    `),
  };
}

// 3. Booking Reminder
export function bookingReminderEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Reminder: Appointment Tomorrow at ${data.salonName} ⏰`,
    html: baseLayout('Booking Reminder', '⏰', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 8px;">Appointment Reminder</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, your appointment is tomorrow!</p>
      ${infoBox([
        { icon: '📍', label: 'Salon', value: data.salonName || '' },
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '📅', label: 'Date', value: data.date || '' },
        { icon: '🕐', label: 'Time', value: data.time || '' },
      ])}
      <p style="color:#999;text-align:center;font-size:13px;">Please arrive 5 minutes early. Need to cancel? Do it at least 2 hours before.</p>
      ${actionButton('View Booking', 'https://salonbooking.lk/bookings')}
    `),
  };
}

// 4. Booking Completed
export function bookingCompletedEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Thank You for Visiting ${data.salonName}! 💇`,
    html: baseLayout('Booking Completed', '💇', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 8px;">Service Complete!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, we hope you loved your visit to ${data.salonName}.</p>
      ${infoBox([
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '💰', label: 'Paid', value: `Rs. ${Number(data.total || 0).toLocaleString()}` },
      ])}
      <p style="color:#555;text-align:center;font-size:14px;">How was your experience? Leave a review!</p>
      ${actionButton('Leave a Review ⭐', `https://salonbooking.lk/bookings`)}
    `),
  };
}

// 5. Booking Cancelled
export function bookingCancelledEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Booking Cancelled - ${data.salonName}`,
    html: baseLayout('Booking Cancelled', '❌', `
      <h2 style="color:${brandColors.red};text-align:center;margin:0 0 8px;">Booking Cancelled</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, your booking has been cancelled.</p>
      ${infoBox([
        { icon: '📍', label: 'Salon', value: data.salonName || '' },
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '📅', label: 'Date', value: data.date || '' },
        { icon: '🕐', label: 'Time', value: data.time || '' },
      ])}
      <p style="color:#555;text-align:center;font-size:14px;">Would you like to rebook?</p>
      ${actionButton('Book Again', `https://salonbooking.lk/explore`, brandColors.blue)}
    `),
  };
}

// 6. Payment Received
export function paymentReceivedEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Payment Received - Rs. ${Number(data.amount || 0).toLocaleString()} 💳`,
    html: baseLayout('Payment Received', '💳', `
      <h2 style="color:${brandColors.green};text-align:center;margin:0 0 8px;">Payment Successful!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, your payment has been received.</p>
      ${infoBox([
        { icon: '💰', label: 'Amount', value: `Rs. ${Number(data.amount || 0).toLocaleString()}` },
        { icon: '💳', label: 'Method', value: data.paymentMethod || 'Online' },
        { icon: '📍', label: 'Salon', value: data.salonName || '' },
        { icon: '🧾', label: 'Ref', value: data.referenceId || '-' },
      ])}
      ${actionButton('View Receipt', 'https://salonbooking.lk/payments')}
    `),
  };
}

// 7. Payment Refunded
export function paymentRefundedEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `Refund Processed - Rs. ${Number(data.amount || 0).toLocaleString()} 💸`,
    html: baseLayout('Refund Processed', '💸', `
      <h2 style="color:${brandColors.blue};text-align:center;margin:0 0 8px;">Refund Processed</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Hi ${data.customerName}, your refund has been processed.</p>
      ${infoBox([
        { icon: '💰', label: 'Refund Amount', value: `Rs. ${Number(data.amount || 0).toLocaleString()}` },
        { icon: '📍', label: 'Salon', value: data.salonName || '' },
        { icon: '📝', label: 'Reason', value: data.reason || 'Booking cancelled' },
      ])}
      <p style="color:#999;text-align:center;font-size:13px;">Refunds may take 3-5 business days to reflect in your account.</p>
    `),
  };
}

// 8. New Booking Alert (Salon Owner)
export function newBookingAlertEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `🔔 New Booking - ${data.serviceName}`,
    html: baseLayout('New Booking Alert', '🔔', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 8px;">New Booking Received!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">You have a new appointment at ${data.salonName}.</p>
      ${infoBox([
        { icon: '👤', label: 'Customer', value: data.customerName || '' },
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '👨‍💼', label: 'Staff', value: data.staffName || 'Any' },
        { icon: '📅', label: 'Date', value: data.date || '' },
        { icon: '🕐', label: 'Time', value: data.time || '' },
        { icon: '💰', label: 'Total', value: `Rs. ${Number(data.total || 0).toLocaleString()}` },
        { icon: '💳', label: 'Payment', value: data.paymentMethod || 'Cash' },
      ])}
      ${actionButton('View Dashboard', 'https://salonbooking.lk/vendor')}
    `),
  };
}

// 9. Booking Cancelled Alert (Salon Owner)
export function bookingCancelledAlertEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `⚠️ Booking Cancelled - ${data.customerName}`,
    html: baseLayout('Booking Cancelled', '⚠️', `
      <h2 style="color:${brandColors.orange};text-align:center;margin:0 0 8px;">Booking Cancelled</h2>
      <p style="color:#555;text-align:center;font-size:15px;">A customer has cancelled their appointment.</p>
      ${infoBox([
        { icon: '👤', label: 'Customer', value: data.customerName || '' },
        { icon: '✂️', label: 'Service', value: data.serviceName || '' },
        { icon: '📅', label: 'Date', value: data.date || '' },
        { icon: '🕐', label: 'Time', value: data.time || '' },
        { icon: '📝', label: 'Reason', value: data.reason || 'Not specified' },
      ])}
      <p style="color:#999;text-align:center;font-size:13px;">This time slot is now available for other customers.</p>
    `),
  };
}

// 10. Daily Summary (Salon Owner)
export function dailySummaryEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `📊 Daily Summary - ${data.date}`,
    html: baseLayout('Daily Summary', '📊', `
      <h2 style="color:${brandColors.dark};text-align:center;margin:0 0 8px;">Daily Summary</h2>
      <p style="color:#555;text-align:center;font-size:15px;">${data.salonName} — ${data.date}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};border-radius:12px 0 0 12px;">
            <div style="font-size:28px;font-weight:700;color:${brandColors.dark};">${data.totalBookings || 0}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">Bookings</div>
          </td>
          <td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};">
            <div style="font-size:28px;font-weight:700;color:${brandColors.green};">Rs.${Number(data.revenue || 0).toLocaleString()}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">Revenue</div>
          </td>
          <td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};border-radius:0 12px 12px 0;">
            <div style="font-size:28px;font-weight:700;color:${brandColors.blue};">${data.completedBookings || 0}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">Completed</div>
          </td>
        </tr>
      </table>
      ${data.upcomingBookings ? `<p style="color:#555;font-size:14px;">📅 <strong>Tomorrow:</strong> ${data.upcomingBookings} upcoming bookings</p>` : ''}
      ${actionButton('View Full Report', 'https://salonbooking.lk/vendor')}
    `),
  };
}

// 11. Payout Processed (Salon Owner)
export function payoutProcessedEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `💰 Payout Processed - Rs. ${Number(data.amount || 0).toLocaleString()}`,
    html: baseLayout('Payout Processed', '🏦', `
      <h2 style="color:${brandColors.green};text-align:center;margin:0 0 8px;">Payout Processed!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Your payout has been successfully processed.</p>
      ${infoBox([
        { icon: '💰', label: 'Amount', value: `Rs. ${Number(data.amount || 0).toLocaleString()}` },
        { icon: '🏦', label: 'Bank', value: data.bankName || '-' },
        { icon: '📝', label: 'Account', value: data.accountNumber ? `****${data.accountNumber.slice(-4)}` : '-' },
        { icon: '🧾', label: 'Reference', value: data.referenceId || '-' },
      ])}
      <p style="color:#999;text-align:center;font-size:13px;">Funds should reflect in your account within 1-3 business days.</p>
      ${actionButton('View Wallet', 'https://salonbooking.lk/vendor')}
    `),
  };
}

// 12. Account Frozen (Salon Owner)
export function accountFrozenEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `🚨 Account Frozen - Action Required`,
    html: baseLayout('Account Frozen', '🚨', `
      <h2 style="color:${brandColors.red};text-align:center;margin:0 0 8px;">Account Frozen</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Your salon <strong>${data.salonName}</strong> has been temporarily frozen.</p>
      ${infoBox([
        { icon: '📝', label: 'Reason', value: data.reason || 'Credit limit exceeded' },
        { icon: '💰', label: 'Outstanding', value: `Rs. ${Number(data.outstandingAmount || 0).toLocaleString()}` },
        { icon: '📊', label: 'Credit Limit', value: `Rs. ${Number(data.creditLimit || 0).toLocaleString()}` },
      ])}
      <p style="color:#555;text-align:center;font-size:14px;">
        Please settle your outstanding commission to reactivate your salon. 
        Your salon will not appear in search results until resolved.
      </p>
      ${actionButton('Settle Now', 'https://salonbooking.lk/vendor', brandColors.red)}
    `),
  };
}

// 13. Account Unfrozen (Salon Owner)
export function accountUnfrozenEmail(data: TemplateData): { subject: string; html: string } {
  return {
    subject: `✅ Account Reactivated - ${data.salonName}`,
    html: baseLayout('Account Reactivated', '🎉', `
      <h2 style="color:${brandColors.green};text-align:center;margin:0 0 8px;">Account Reactivated!</h2>
      <p style="color:#555;text-align:center;font-size:15px;">Great news! Your salon <strong>${data.salonName}</strong> is back online.</p>
      <p style="color:#555;text-align:center;font-size:14px;line-height:1.6;">
        Your outstanding balance has been settled and your salon is now visible to customers again.
        Thank you for your prompt action!
      </p>
      ${actionButton('Go to Dashboard', 'https://salonbooking.lk/vendor', brandColors.green)}
    `),
  };
}

// ============ TEMPLATE MAP ============

export type EmailTemplateType =
  | 'welcome'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_refunded'
  | 'new_booking_alert'
  | 'booking_cancelled_alert'
  | 'daily_summary'
  | 'payout_processed'
  | 'account_frozen'
  | 'account_unfrozen';

const templateMap: Record<EmailTemplateType, (data: TemplateData) => { subject: string; html: string }> = {
  welcome: welcomeEmail,
  booking_confirmed: bookingConfirmedEmail,
  booking_reminder: bookingReminderEmail,
  booking_completed: bookingCompletedEmail,
  booking_cancelled: bookingCancelledEmail,
  payment_received: paymentReceivedEmail,
  payment_refunded: paymentRefundedEmail,
  new_booking_alert: newBookingAlertEmail,
  booking_cancelled_alert: bookingCancelledAlertEmail,
  daily_summary: dailySummaryEmail,
  payout_processed: payoutProcessedEmail,
  account_frozen: accountFrozenEmail,
  account_unfrozen: accountUnfrozenEmail,
};

export function getEmailTemplate(type: EmailTemplateType, data: TemplateData): { subject: string; html: string } {
  const templateFn = templateMap[type];
  if (!templateFn) {
    throw new Error(`Unknown email template type: ${type}`);
  }
  return templateFn(data);
}

export { templateMap };
