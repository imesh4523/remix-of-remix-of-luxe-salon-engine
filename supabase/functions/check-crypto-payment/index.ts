import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
const NOWPAYMENTS_SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1";

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

    const userId = claimsData.claims.sub as string;

    const { payment_id, invoice_id } = await req.json();

    if (!payment_id && !invoice_id) {
      throw new Error("Either payment_id or invoice_id is required");
    }

    // Check our database - scoped to authenticated user
    let query = supabase.from("crypto_payments").select("*").eq("user_id", userId);

    if (payment_id) {
      query = query.eq("id", payment_id);
    } else {
      query = query.eq("invoice_id", invoice_id);
    }

    const { data: cryptoPayment, error: fetchError } = await query.single();

    if (fetchError || !cryptoPayment) {
      throw new Error("Payment not found");
    }

    // If already in terminal state, return cached
    if (["confirmed", "finished", "failed", "expired", "refunded"].includes(cryptoPayment.status)) {
      return new Response(
        JSON.stringify({
          success: true,
          status: cryptoPayment.status,
          pay_address: cryptoPayment.pay_address,
          pay_amount: cryptoPayment.pay_amount,
          actually_paid: cryptoPayment.actually_paid,
          expires_at: cryptoPayment.expires_at,
          paid_at: cryptoPayment.paid_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (cryptoPayment.expires_at && new Date(cryptoPayment.expires_at) < new Date()) {
      await supabase.from("crypto_payments").update({ status: "expired" }).eq("id", cryptoPayment.id);

      return new Response(
        JSON.stringify({
          success: true,
          status: "expired",
          pay_address: cryptoPayment.pay_address,
          pay_amount: cryptoPayment.pay_amount,
          expires_at: cryptoPayment.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get NOWPayments settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["nowpayments_api_key", "nowpayments_sandbox"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string | null }) => {
      settingsMap[s.key] = s.value || "";
    });

    const apiKey = settingsMap["nowpayments_api_key"];
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          status: cryptoPayment.status,
          pay_address: cryptoPayment.pay_address,
          pay_amount: cryptoPayment.pay_amount,
          expires_at: cryptoPayment.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSandbox = settingsMap["nowpayments_sandbox"] === "true";
    const baseUrl = isSandbox ? NOWPAYMENTS_SANDBOX_URL : NOWPAYMENTS_API_URL;

    const statusResponse = await fetch(`${baseUrl}/payment/${cryptoPayment.invoice_id}`, {
      headers: { "x-api-key": apiKey },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      let newStatus = cryptoPayment.status;
      if (statusData.payment_status) {
        const npStatus = statusData.payment_status.toLowerCase();
        if (npStatus === "finished" || npStatus === "confirmed") newStatus = "confirmed";
        else if (npStatus === "waiting" || npStatus === "pending") newStatus = "waiting";
        else if (npStatus === "confirming" || npStatus === "sending") newStatus = "confirming";
        else if (npStatus === "partially_paid") newStatus = "partially_paid";
        else if (npStatus === "expired") newStatus = "expired";
        else if (npStatus === "failed") newStatus = "failed";
        else if (npStatus === "refunded") newStatus = "refunded";
      }

      if (newStatus !== cryptoPayment.status) {
        const updateData: Record<string, unknown> = {
          status: newStatus,
          actually_paid: statusData.actually_paid,
          payment_id: statusData.payment_id?.toString(),
        };
        if (newStatus === "confirmed" || newStatus === "finished") {
          updateData.paid_at = new Date().toISOString();
        }
        await supabase.from("crypto_payments").update(updateData).eq("id", cryptoPayment.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          pay_address: cryptoPayment.pay_address || statusData.pay_address,
          pay_amount: cryptoPayment.pay_amount || statusData.pay_amount,
          actually_paid: statusData.actually_paid,
          expires_at: cryptoPayment.expires_at,
          paid_at: newStatus === "confirmed" ? new Date().toISOString() : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: cryptoPayment.status,
        pay_address: cryptoPayment.pay_address,
        pay_amount: cryptoPayment.pay_amount,
        expires_at: cryptoPayment.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking crypto payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
