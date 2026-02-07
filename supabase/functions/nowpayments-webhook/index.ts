import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig",
};

interface IPNPayload {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  // Sort JSON keys and create hash
  const sortedPayload = JSON.stringify(
    JSON.parse(payload),
    Object.keys(JSON.parse(payload)).sort()
  );
  
  const hmac = createHmac("sha512", secret);
  hmac.update(sortedPayload);
  const calculatedSig = hmac.digest("hex");
  
  return calculatedSig === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-nowpayments-sig");

    // Get IPN secret from settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .eq("key", "nowpayments_ipn_secret")
      .single();

    const ipnSecret = settings?.value;

    // Verify signature if secret is configured
    if (ipnSecret && signature) {
      const isValid = verifySignature(rawBody, signature, ipnSecret);
      if (!isValid) {
        console.error("Invalid IPN signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: IPNPayload = JSON.parse(rawBody);
    console.log("NOWPayments IPN received:", payload);

    const { order_id, payment_status, actually_paid, payment_id, outcome_amount, outcome_currency } = payload;

    if (!order_id) {
      throw new Error("Missing order_id in IPN payload");
    }

    // Map NOWPayments status to our status
    let status: string;
    switch (payment_status.toLowerCase()) {
      case "finished":
      case "confirmed":
        status = "confirmed";
        break;
      case "waiting":
      case "pending":
        status = "waiting";
        break;
      case "confirming":
      case "sending":
        status = "confirming";
        break;
      case "partially_paid":
        status = "partially_paid";
        break;
      case "expired":
        status = "expired";
        break;
      case "failed":
        status = "failed";
        break;
      case "refunded":
        status = "refunded";
        break;
      default:
        status = "waiting";
    }

    // Update crypto payment record
    const updateData: Record<string, unknown> = {
      status,
      actually_paid,
      payment_id: payment_id?.toString(),
      outcome_amount,
      outcome_currency,
    };

    if (status === "confirmed") {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: cryptoPayment, error: updateError } = await supabase
      .from("crypto_payments")
      .update(updateData)
      .eq("order_id", order_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update crypto payment:", updateError);
      throw new Error("Failed to update payment record");
    }

    // If payment is confirmed and has a booking_id, update the booking
    if (status === "confirmed" && cryptoPayment?.booking_id) {
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", cryptoPayment.booking_id);

      console.log("Booking payment status updated:", cryptoPayment.booking_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing IPN:", error);
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
