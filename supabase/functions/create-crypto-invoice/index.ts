import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
const NOWPAYMENTS_SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1";

interface CreateInvoiceRequest {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description: string;
  salon_id: string;
  service_id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get NOWPayments settings from system_settings
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["nowpayments_enabled", "nowpayments_api_key", "nowpayments_sandbox"]);

    if (settingsError) {
      throw new Error("Failed to fetch payment settings");
    }

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string | null }) => {
      settingsMap[s.key] = s.value || "";
    });

    if (settingsMap["nowpayments_enabled"] !== "true") {
      throw new Error("Crypto payments are not enabled");
    }

    const apiKey = settingsMap["nowpayments_api_key"];
    if (!apiKey) {
      throw new Error("NOWPayments API key not configured");
    }

    const isSandbox = settingsMap["nowpayments_sandbox"] === "true";
    const baseUrl = isSandbox ? NOWPAYMENTS_SANDBOX_URL : NOWPAYMENTS_API_URL;

    // Parse request body
    const body: CreateInvoiceRequest = await req.json();
    const {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      order_description,
    } = body;

    if (!price_amount || !pay_currency || !order_id) {
      throw new Error("Missing required fields: price_amount, pay_currency, order_id");
    }

    // Get the callback URL for IPN
    const ipnCallbackUrl = `${supabaseUrl}/functions/v1/nowpayments-webhook`;

    // Create invoice with NOWPayments API
    const invoiceResponse = await fetch(`${baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount,
        price_currency: price_currency || "USD",
        pay_currency: pay_currency.toLowerCase(),
        order_id,
        order_description: order_description || "Salon Booking",
        ipn_callback_url: ipnCallbackUrl,
        is_fee_paid_by_user: false,
      }),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error("NOWPayments API error:", errorText);
      throw new Error(`NOWPayments API error: ${invoiceResponse.status}`);
    }

    const invoiceData = await invoiceResponse.json();
    console.log("Invoice created:", invoiceData);

    // Store crypto payment record in database
    const { data: cryptoPayment, error: insertError } = await supabase
      .from("crypto_payments")
      .insert({
        user_id: user.id,
        invoice_id: invoiceData.id?.toString() || invoiceData.invoice_id?.toString(),
        order_id,
        pay_currency: pay_currency.toLowerCase(),
        pay_amount: invoiceData.pay_amount,
        pay_address: invoiceData.pay_address,
        price_amount,
        price_currency: price_currency || "USD",
        status: "waiting",
        ipn_callback_url: ipnCallbackUrl,
        expires_at: invoiceData.expiration_estimate_date 
          ? new Date(invoiceData.expiration_estimate_date).toISOString()
          : new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 min default
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store crypto payment:", insertError);
      throw new Error("Failed to store payment record");
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: cryptoPayment.id,
        invoice_id: invoiceData.id || invoiceData.invoice_id,
        pay_address: invoiceData.pay_address,
        pay_amount: invoiceData.pay_amount,
        pay_currency: pay_currency.toLowerCase(),
        price_amount,
        price_currency: price_currency || "USD",
        expires_at: cryptoPayment.expires_at,
        invoice_url: invoiceData.invoice_url, // Optional redirect URL if needed
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating crypto invoice:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
