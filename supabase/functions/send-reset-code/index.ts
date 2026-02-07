import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendResetCodeRequest {
  email: string;
}

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: SendResetCodeRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email === email);

    if (!userExists) {
      // Don't reveal if email exists - return success anyway for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset code has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing codes for this email
    await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // Insert new code
    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw new Error("Failed to create reset code");
    }

    // Get SMTP settings from system_settings
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_from_email", "smtp_from_name", "smtp_secure", "email_provider", "resend_api_key"]);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error("Failed to fetch email settings");
    }

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });

    const smtpHost = settingsMap["smtp_host"];
    const smtpPort = parseInt(settingsMap["smtp_port"] || "587");
    const smtpUsername = settingsMap["smtp_username"];
    const smtpPassword = settingsMap["smtp_password"];
    const fromEmail = settingsMap["smtp_from_email"] || "noreply@example.com";
    const fromName = settingsMap["smtp_from_name"] || "Password Reset";
    const useSecure = settingsMap["smtp_secure"] === "true";

    // Check if SMTP is configured
    if (!smtpHost || !smtpUsername || !smtpPassword) {
      console.log("SMTP not configured. Code:", code);
      // Return success but log the code for development
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reset code generated. (SMTP not configured - check server logs)",
          devCode: code // Only for development!
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: useSecure,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Password Reset Code",
      content: "auto",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Code</h2>
          <p style="color: #666;">You requested to reset your password. Use the code below:</p>
          <div style="background: linear-gradient(135deg, #f5f5f5, #e8e8e8); border-radius: 12px; padding: 30px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">This code expires in 15 minutes.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Reset code sent to your email." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-reset-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
