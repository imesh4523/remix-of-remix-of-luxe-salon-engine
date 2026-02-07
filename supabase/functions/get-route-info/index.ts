import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  coordinates: [number, number][]; // [lng, lat] pairs
}

interface RouteResponse {
  distance: number; // meters
  duration: number; // seconds
  durationMinutes: number;
  distanceKm: number;
  source: 'osrm' | 'fallback';
  geometry?: RouteGeometry; // Route path coordinates
}

// Haversine formula for fallback straight-line distance
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
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

// Estimate duration from straight-line distance (30 km/h average in urban Sri Lanka)
const estimateDuration = (distanceKm: number): number => {
  const averageSpeedKmh = 30;
  return (distanceKm / averageSpeedKmh) * 60; // minutes
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originLat, originLng, destLat, destLng }: RouteRequest = await req.json();

    // Validate coordinates
    if (!originLat || !originLng || !destLat || !destLng) {
      return new Response(
        JSON.stringify({ error: 'Missing coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OSRM public API with full geometry
    // Note: OSRM uses longitude,latitude order
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    
    console.log('Calling OSRM:', osrmUrl);

    const osrmResponse = await fetch(osrmUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GlamBook/1.0',
      },
    });

    if (!osrmResponse.ok) {
      console.error('OSRM API error:', osrmResponse.status);
      throw new Error('OSRM API error');
    }

    const osrmData = await osrmResponse.json();

    if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
      const route = osrmData.routes[0];
      const response: RouteResponse = {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        durationMinutes: Math.round(route.duration / 60),
        distanceKm: route.distance / 1000,
        source: 'osrm',
        geometry: route.geometry, // GeoJSON LineString with coordinates
      };

      console.log('OSRM response with geometry:', {
        ...response,
        geometryPointCount: response.geometry?.coordinates?.length || 0,
      });

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('OSRM no route found:', osrmData);
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Route calculation error, using fallback:', error);

    // Fallback to straight-line calculation
    try {
      const { originLat, originLng, destLat, destLng }: RouteRequest = await req.clone().json();
      
      const distanceKm = haversineDistance(originLat, originLng, destLat, destLng);
      const durationMinutes = estimateDuration(distanceKm);

      const response: RouteResponse = {
        distance: distanceKm * 1000, // meters
        duration: durationMinutes * 60, // seconds
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
