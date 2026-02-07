import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Preference check map: which preference column gates which notification type
const pushPreferenceMap: Record<string, string> = {
  booking_confirmed: "push_booking_updates",
  booking_cancelled: "push_booking_updates",
  new_booking_alert: "push_booking_updates",
  booking_reminder: "push_reminders",
  payment_received: "push_payment_updates",
  payout_processed: "push_payment_updates",
};

// Base64 URL decode helper
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Import crypto key from raw bytes
async function importVapidKey(rawKey: string): Promise<CryptoKey> {
  const keyData = urlBase64ToUint8Array(rawKey);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const encodeBase64Url = (data: string) =>
    btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = encodeBase64Url(JSON.stringify(header));
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKey = await importVapidKey(privateKeyBase64);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${unsignedToken}.${signatureB64}`;
}

// Send a single push notification using Web Push protocol
async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;

  const jwt = await createVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      TTL: "86400",
      Urgency: "normal",
    },
    body: payload,
  });

  return response;
}

interface SendPushRequest {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  url?: string;
  type?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check: require valid JWT (admin or service_role)
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

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@salonbooking.lk";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, userIds, title, body, url, type, data }: SendPushRequest = await req.json();

    if (!title || !body) {
      throw new Error("Missing required fields: title, body");
    }

    const targetUserIds: string[] = [];
    if (userIds?.length) targetUserIds.push(...userIds);
    else if (userId) targetUserIds.push(userId);
    else throw new Error("Missing userId or userIds");

    const results: { userId: string; sent: number; failed: number; skipped: boolean }[] = [];

    for (const uid of targetUserIds) {
      if (type) {
        const prefKey = pushPreferenceMap[type];
        if (prefKey) {
          const { data: prefs } = await supabase
            .from("notification_preferences")
            .select(`push_enabled, ${prefKey}`)
            .eq("user_id", uid)
            .maybeSingle();

          if (prefs) {
            if (!prefs.push_enabled || !prefs[prefKey]) {
              console.log(`User ${uid} has push disabled for ${type}, skipping`);
              results.push({ userId: uid, sent: 0, failed: 0, skipped: true });
              continue;
            }
          }
        }
      }

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh_key, auth_key")
        .eq("user_id", uid)
        .eq("is_active", true);

      if (!subscriptions?.length) {
        results.push({ userId: uid, sent: 0, failed: 0, skipped: false });
        continue;
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: "/pwa-192x192.png",
        url: url || "/",
        data,
      });

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        try {
          const response = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);

          if (response.ok || response.status === 201) {
            sent++;
            await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", sub.id);
          } else if (response.status === 410 || response.status === 404) {
            console.log(`Subscription ${sub.id} expired, deactivating`);
            await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
            failed++;
          } else {
            console.error(`Push failed for ${sub.id}: ${response.status} ${await response.text()}`);
            failed++;
          }
        } catch (err) {
          console.error(`Push error for ${sub.id}:`, err);
          failed++;
        }
      }

      results.push({ userId: uid, sent, failed, skipped: false });
    }

    console.log(`Push results:`, JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-push:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
