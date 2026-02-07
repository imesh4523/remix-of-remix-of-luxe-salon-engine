import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

interface RouteResponse {
  distance: number;
  duration: number;
  durationMinutes: number;
  distanceKm: number;
  source: 'osrm' | 'fallback';
  geometry?: RouteGeometry;
}

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimateDuration = (distanceKm: number): number => {
  const averageSpeedKmh = 30;
  return (distanceKm / averageSpeedKmh) * 60;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT using getClaims
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { originLat, originLng, destLat, destLng }: RouteRequest = await req.json();

    if (!originLat || !originLng || !destLat || !destLng) {
      return new Response(
        JSON.stringify({ error: 'Missing coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    
    console.log('Calling OSRM:', osrmUrl);

    const osrmResponse = await fetch(osrmUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'GlamBook/1.0' },
    });

    if (!osrmResponse.ok) {
      console.error('OSRM API error:', osrmResponse.status);
      throw new Error('OSRM API error');
    }

    const osrmData = await osrmResponse.json();

    if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
      const route = osrmData.routes[0];
      const response: RouteResponse = {
        distance: route.distance,
        duration: route.duration,
        durationMinutes: Math.round(route.duration / 60),
        distanceKm: route.distance / 1000,
        source: 'osrm',
        geometry: route.geometry,
      };

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Route calculation error, using fallback:', error);

    try {
      const { originLat, originLng, destLat, destLng }: RouteRequest = await req.clone().json();
      
      const distanceKm = haversineDistance(originLat, originLng, destLat, destLng);
      const durationMinutes = estimateDuration(distanceKm);

      const response: RouteResponse = {
        distance: distanceKm * 1000,
        duration: durationMinutes * 60,
        durationMinutes: Math.round(durationMinutes),
        distanceKm: distanceKm,
        source: 'fallback',
      };

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate route' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
});
