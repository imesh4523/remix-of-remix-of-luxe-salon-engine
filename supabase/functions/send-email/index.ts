import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Template types matching src/lib/email-templates.ts
type EmailTemplateType =
  | "welcome"
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_completed"
  | "booking_cancelled"
  | "payment_received"
  | "payment_refunded"
  | "new_booking_alert"
  | "booking_cancelled_alert"
  | "daily_summary"
  | "payout_processed"
  | "account_frozen"
  | "account_unfrozen";

const preferenceCheckMap: Record<string, string> = {
  booking_confirmed: "email_booking_confirm",
  booking_reminder: "email_booking_reminder",
  booking_completed: "email_booking_complete",
  booking_cancelled: "email_booking_cancelled",
  payment_received: "email_payment_received",
  new_booking_alert: "email_booking_confirm",
  booking_cancelled_alert: "email_booking_cancelled",
  daily_summary: "email_promotions",
};

interface SendEmailRequest {
  to: string;
  type: EmailTemplateType;
  data: Record<string, any>;
  userId?: string;
  skipPreferenceCheck?: boolean;
}

const brandColors = {
  gold: "#D4A574",
  goldLight: "#E8C9A8",
  dark: "#141516",
  darkGray: "#1E1F20",
  lightGray: "#F5F0EB",
  white: "#FFFFFF",
  green: "#22C55E",
  red: "#EF4444",
  blue: "#3B82F6",
  orange: "#F59E0B",
};

const baseLayout = (title: string, icon: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:${brandColors.lightGray};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brandColors.lightGray};padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,${brandColors.dark},${brandColors.darkGray});border-radius:16px 16px 0 0;padding:30px 40px;text-align:center;">
<h1 style="margin:0;font-size:24px;font-weight:700;color:${brandColors.gold};letter-spacing:1px;">SALONBOOKING.LK</h1>
<p style="margin:6px 0 0;font-size:13px;color:${brandColors.goldLight};letter-spacing:2px;">✨ Your Beauty Destination ✨</p>
</td></tr>
<tr><td style="background-color:${brandColors.white};padding:30px 40px 10px;text-align:center;"><div style="font-size:48px;">${icon}</div></td></tr>
<tr><td style="background-color:${brandColors.white};padding:10px 40px 30px;">${content}</td></tr>
<tr><td style="background-color:${brandColors.dark};border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} SalonBooking.lk | Colombo, Sri Lanka</p>
<p style="margin:8px 0 0;font-size:11px;color:#666;">
<a href="https://salonbooking.lk/settings" style="color:${brandColors.goldLight};text-decoration:none;">Unsubscribe</a> · 
<a href="https://salonbooking.lk/privacy" style="color:${brandColors.goldLight};text-decoration:none;">Privacy Policy</a>
</p></td></tr>
</table></td></tr></table></body></html>`;

const infoBox = (items: { icon: string; label: string; value: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColors.lightGray};border-radius:12px;padding:20px;margin:16px 0;">
  ${items.map((i) => `<tr><td style="padding:6px 0;font-size:14px;color:#666;width:30px;vertical-align:top;">${i.icon}</td><td style="padding:6px 0;font-size:14px;color:#333;"><strong>${i.label}:</strong> ${i.value}</td></tr>`).join("")}
  </table>`;

const btn = (text: string, url: string, color = brandColors.gold) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;"><tr><td style="background-color:${color};border-radius:8px;"><a href="${url}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">${text}</a></td></tr></table>`;

const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString()}`;

function generateTemplate(type: EmailTemplateType, d: Record<string, any>): { subject: string; html: string } {
  switch (type) {
    case "welcome":
      return { subject: "Welcome to SalonBooking.lk! 🎉", html: baseLayout("Welcome", "👋", `<h2 style="color:${brandColors.dark};text-align:center;">Welcome, ${d.customerName || "there"}!</h2><p style="color:#555;text-align:center;font-size:15px;">We're thrilled to have you join SalonBooking.lk.</p>${btn("Explore Salons", "https://salonbooking.lk/explore")}`) };
    case "booking_confirmed":
      return { subject: `Booking Confirmed ✅ - ${d.salonName}`, html: baseLayout("Confirmed", "✅", `<h2 style="color:${brandColors.dark};text-align:center;">Booking Confirmed!</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, your appointment is set.</p>${infoBox([{ icon: "📍", label: "Salon", value: d.salonName || "" }, { icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "👤", label: "Stylist", value: d.staffName || "Any" }, { icon: "📅", label: "Date", value: d.date || "" }, { icon: "🕐", label: "Time", value: d.time || "" }, { icon: "💰", label: "Total", value: fmt(d.total) }])}${btn("View Booking", "https://salonbooking.lk/bookings")}`) };
    case "booking_reminder":
      return { subject: `Reminder: Tomorrow at ${d.salonName} ⏰`, html: baseLayout("Reminder", "⏰", `<h2 style="color:${brandColors.dark};text-align:center;">Appointment Tomorrow!</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, don't forget your appointment.</p>${infoBox([{ icon: "📍", label: "Salon", value: d.salonName || "" }, { icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "📅", label: "Date", value: d.date || "" }, { icon: "🕐", label: "Time", value: d.time || "" }])}${btn("View Booking", "https://salonbooking.lk/bookings")}`) };
    case "booking_completed":
      return { subject: `Thank You! - ${d.salonName} 💇`, html: baseLayout("Completed", "💇", `<h2 style="color:${brandColors.dark};text-align:center;">Service Complete!</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, we hope you loved your visit.</p>${infoBox([{ icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "💰", label: "Paid", value: fmt(d.total) }])}${btn("Leave a Review ⭐", "https://salonbooking.lk/bookings")}`) };
    case "booking_cancelled":
      return { subject: `Booking Cancelled - ${d.salonName}`, html: baseLayout("Cancelled", "❌", `<h2 style="color:${brandColors.red};text-align:center;">Booking Cancelled</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, your booking has been cancelled.</p>${infoBox([{ icon: "📍", label: "Salon", value: d.salonName || "" }, { icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "📅", label: "Date", value: d.date || "" }, { icon: "🕐", label: "Time", value: d.time || "" }])}${btn("Book Again", "https://salonbooking.lk/explore", brandColors.blue)}`) };
    case "payment_received":
      return { subject: `Payment Received - ${fmt(d.amount)} 💳`, html: baseLayout("Payment", "💳", `<h2 style="color:${brandColors.green};text-align:center;">Payment Successful!</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, your payment was received.</p>${infoBox([{ icon: "💰", label: "Amount", value: fmt(d.amount) }, { icon: "💳", label: "Method", value: d.paymentMethod || "Online" }, { icon: "📍", label: "Salon", value: d.salonName || "" }])}${btn("View Receipt", "https://salonbooking.lk/payments")}`) };
    case "payment_refunded":
      return { subject: `Refund Processed - ${fmt(d.amount)} 💸`, html: baseLayout("Refund", "💸", `<h2 style="color:${brandColors.blue};text-align:center;">Refund Processed</h2><p style="color:#555;text-align:center;">Hi ${d.customerName}, your refund is on its way.</p>${infoBox([{ icon: "💰", label: "Refund", value: fmt(d.amount) }, { icon: "📍", label: "Salon", value: d.salonName || "" }])}<p style="color:#999;text-align:center;font-size:13px;">Refunds take 3-5 business days.</p>`) };
    case "new_booking_alert":
      return { subject: `🔔 New Booking - ${d.serviceName}`, html: baseLayout("New Booking", "🔔", `<h2 style="color:${brandColors.dark};text-align:center;">New Booking!</h2><p style="color:#555;text-align:center;">New appointment at ${d.salonName}.</p>${infoBox([{ icon: "👤", label: "Customer", value: d.customerName || "" }, { icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "📅", label: "Date", value: d.date || "" }, { icon: "🕐", label: "Time", value: d.time || "" }, { icon: "💰", label: "Total", value: fmt(d.total) }, { icon: "💳", label: "Payment", value: d.paymentMethod || "Cash" }])}${btn("View Dashboard", "https://salonbooking.lk/vendor")}`) };
    case "booking_cancelled_alert":
      return { subject: `⚠️ Cancelled - ${d.customerName}`, html: baseLayout("Cancelled", "⚠️", `<h2 style="color:${brandColors.orange};text-align:center;">Booking Cancelled</h2><p style="color:#555;text-align:center;">A customer cancelled their appointment.</p>${infoBox([{ icon: "👤", label: "Customer", value: d.customerName || "" }, { icon: "✂️", label: "Service", value: d.serviceName || "" }, { icon: "📅", label: "Date", value: d.date || "" }, { icon: "🕐", label: "Time", value: d.time || "" }])}<p style="color:#999;text-align:center;font-size:13px;">This slot is now available.</p>`) };
    case "daily_summary":
      return { subject: `📊 Daily Summary - ${d.date}`, html: baseLayout("Summary", "📊", `<h2 style="color:${brandColors.dark};text-align:center;">Daily Summary</h2><p style="color:#555;text-align:center;">${d.salonName} — ${d.date}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};border-radius:12px 0 0 12px;"><div style="font-size:28px;font-weight:700;color:${brandColors.dark};">${d.totalBookings || 0}</div><div style="font-size:12px;color:#999;">Bookings</div></td><td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};"><div style="font-size:28px;font-weight:700;color:${brandColors.green};">${fmt(d.revenue)}</div><div style="font-size:12px;color:#999;">Revenue</div></td><td style="width:33%;text-align:center;padding:16px;background:${brandColors.lightGray};border-radius:0 12px 12px 0;"><div style="font-size:28px;font-weight:700;color:${brandColors.blue};">${d.completedBookings || 0}</div><div style="font-size:12px;color:#999;">Completed</div></td></tr></table>${btn("View Report", "https://salonbooking.lk/vendor")}`) };
    case "payout_processed":
      return { subject: `💰 Payout - ${fmt(d.amount)}`, html: baseLayout("Payout", "🏦", `<h2 style="color:${brandColors.green};text-align:center;">Payout Processed!</h2>${infoBox([{ icon: "💰", label: "Amount", value: fmt(d.amount) }, { icon: "🏦", label: "Bank", value: d.bankName || "-" }])}<p style="color:#999;text-align:center;font-size:13px;">Funds reflect in 1-3 business days.</p>${btn("View Wallet", "https://salonbooking.lk/vendor")}`) };
    case "account_frozen":
      return { subject: "🚨 Account Frozen - Action Required", html: baseLayout("Frozen", "🚨", `<h2 style="color:${brandColors.red};text-align:center;">Account Frozen</h2><p style="color:#555;text-align:center;">Your salon <strong>${d.salonName}</strong> has been frozen.</p>${infoBox([{ icon: "📝", label: "Reason", value: d.reason || "Credit limit exceeded" }, { icon: "💰", label: "Outstanding", value: fmt(d.outstandingAmount) }, { icon: "📊", label: "Limit", value: fmt(d.creditLimit) }])}<p style="color:#555;text-align:center;font-size:14px;">Settle your commission to reactivate.</p>${btn("Settle Now", "https://salonbooking.lk/vendor", brandColors.red)}`) };
    case "account_unfrozen":
      return { subject: `✅ Account Reactivated - ${d.salonName}`, html: baseLayout("Reactivated", "🎉", `<h2 style="color:${brandColors.green};text-align:center;">Account Reactivated!</h2><p style="color:#555;text-align:center;">Your salon <strong>${d.salonName}</strong> is back online!</p>${btn("Go to Dashboard", "https://salonbooking.lk/vendor", brandColors.green)}`) };
    default:
      throw new Error(`Unknown template: ${type}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT using getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, type, data, userId, skipPreferenceCheck }: SendEmailRequest = await req.json();

    if (!to || !type || !data) {
      throw new Error("Missing required fields: to, type, data");
    }

    // Check user notification preferences (unless skipped)
    if (!skipPreferenceCheck && userId) {
      const prefKey = preferenceCheckMap[type];
      if (prefKey) {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select(prefKey)
          .eq("user_id", userId)
          .maybeSingle();

        if (prefs && prefs[prefKey] === false) {
          console.log(`User ${userId} has disabled ${prefKey}, skipping email`);
          await supabase.from("email_logs").insert({
            recipient_email: to,
            template_type: type,
            subject: `[SKIPPED] ${type}`,
            status: "skipped",
            user_id: userId,
            metadata: { reason: "user_preference_disabled", preference_key: prefKey },
          });
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "user_preference_disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const { subject, html } = generateTemplate(type, data);

    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "smtp_host", "smtp_port", "smtp_username", "smtp_password",
        "smtp_from_email", "smtp_from_name", "smtp_secure",
      ]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value || ""; });

    const smtpHost = settingsMap["smtp_host"];
    const smtpPort = parseInt(settingsMap["smtp_port"] || "587");
    const smtpUsername = settingsMap["smtp_username"];
    const smtpPassword = settingsMap["smtp_password"];
    const fromEmail = settingsMap["smtp_from_email"] || "noreply@salonbooking.lk";
    const fromName = settingsMap["smtp_from_name"] || "SalonBooking.lk";
    const useSecure = settingsMap["smtp_secure"] === "true";

    const { data: logEntry } = await supabase.from("email_logs").insert({
      recipient_email: to,
      template_type: type,
      subject,
      status: "pending",
      user_id: userId || null,
      metadata: data,
    }).select("id").single();

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      console.warn("SMTP not configured. Email logged but not sent.");
      if (logEntry) {
        await supabase.from("email_logs").update({
          status: "failed",
          error_message: "SMTP not configured",
        }).eq("id", logEntry.id);
      }
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured", logId: logEntry?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: useSecure,
        auth: { username: smtpUsername, password: smtpPassword },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      content: "auto",
      html,
    });

    await client.close();

    if (logEntry) {
      await supabase.from("email_logs").update({
        status: "sent",
        sent_at: new Date().toISOString(),
      }).eq("id", logEntry.id);
    }

    console.log(`Email sent: ${type} -> ${to}`);

    return new Response(
      JSON.stringify({ success: true, logId: logEntry?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
