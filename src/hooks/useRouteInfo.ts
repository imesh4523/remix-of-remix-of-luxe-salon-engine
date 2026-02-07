import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs from OSRM
}

interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  durationMinutes: number;
  distanceKm: number;
  source: 'osrm' | 'fallback';
  geometry?: RouteGeometry; // Route path for drawing on map
}

export type { RouteInfo, RouteGeometry };

interface UseRouteInfoOptions {
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  enabled?: boolean;
}

interface UseRouteInfoReturn {
  routeInfo: RouteInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple in-memory cache with TTL
const routeCache = new Map<string, { data: RouteInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (originLat: number, originLng: number, destLat: number, destLng: number): string => {
  // Round to 4 decimal places for cache key (about 11 meters precision)
  return `${originLat.toFixed(4)},${originLng.toFixed(4)}-${destLat.toFixed(4)},${destLng.toFixed(4)}`;
};

const getCachedRoute = (key: string): RouteInfo | null => {
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    routeCache.delete(key);
  }
  return null;
};

const setCachedRoute = (key: string, data: RouteInfo): void => {
  routeCache.set(key, { data, timestamp: Date.now() });
};

export const useRouteInfo = ({
  originLat,
  originLng,
  destLat,
  destLng,
  enabled = true,
}: UseRouteInfoOptions): UseRouteInfoReturn => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRoute = useCallback(async () => {
    if (!enabled || originLat === null || originLng === null || destLat === null || destLng === null) {
      return;
    }

    const cacheKey = getCacheKey(originLat, originLng, destLat, destLng);
    
    // Check cache first
    const cached = getCachedRoute(cacheKey);
    if (cached) {
      setRouteInfo(cached);
      return;
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('get-route-info', {
        body: {
          originLat,
          originLng,
          destLat,
          destLng,
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data && !data.error) {
        setRouteInfo(data);
        setCachedRoute(cacheKey, data);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Route info fetch error:', err);
        setError(err.message || 'Failed to get route info');
        
        // Use fallback estimation
        const fallbackInfo = getFallbackRouteInfo(originLat, originLng, destLat, destLng);
        setRouteInfo(fallbackInfo);
      }
    } finally {
      setIsLoading(false);
    }
  }, [originLat, originLng, destLat, destLng, enabled]);

  useEffect(() => {
    fetchRoute();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRoute]);

  const refetch = useCallback(() => {
    // Clear cache for this route and refetch
    if (originLat !== null && originLng !== null && destLat !== null && destLng !== null) {
      const cacheKey = getCacheKey(originLat, originLng, destLat, destLng);
      routeCache.delete(cacheKey);
    }
    fetchRoute();
  }, [fetchRoute, originLat, originLng, destLat, destLng]);

  return { routeInfo, isLoading, error, refetch };
};

// Fallback calculation using Haversine formula
const getFallbackRouteInfo = (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): RouteInfo => {
  const R = 6371; // Earth's radius in km
  const dLat = ((destLat - originLat) * Math.PI) / 180;
  const dLon = ((destLng - originLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originLat * Math.PI) / 180) *
    Math.cos((destLat * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  // Assume 30 km/h average speed in urban Sri Lanka
  const durationMinutes = Math.round((distanceKm / 30) * 60);

  return {
    distance: distanceKm * 1000,
    duration: durationMinutes * 60,
    durationMinutes,
    distanceKm,
    source: 'fallback',
  };
};

// Batch route info hook for multiple destinations
interface BatchRouteDestination {
  id: string;
  lat: number;
  lng: number;
}

interface BatchRouteResult {
  [id: string]: RouteInfo | null;
}

export const useBatchRouteInfo = (
  originLat: number | null,
  originLng: number | null,
  destinations: BatchRouteDestination[],
  enabled = true
): { routes: BatchRouteResult; isLoading: boolean } => {
  const [routes, setRoutes] = useState<BatchRouteResult>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || originLat === null || originLng === null || destinations.length === 0) {
      return;
    }

    const fetchRoutes = async () => {
      setIsLoading(true);
      const results: BatchRouteResult = {};

      // Fetch routes in parallel (with rate limiting - max 3 concurrent)
      const batchSize = 3;
      for (let i = 0; i < destinations.length; i += batchSize) {
        const batch = destinations.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (dest) => {
          const cacheKey = getCacheKey(originLat, originLng, dest.lat, dest.lng);
          const cached = getCachedRoute(cacheKey);
          
          if (cached) {
            return { id: dest.id, info: cached };
          }

          try {
            const { data } = await supabase.functions.invoke('get-route-info', {
              body: {
                originLat,
                originLng,
                destLat: dest.lat,
                destLng: dest.lng,
              },
            });

            if (data && !data.error) {
              setCachedRoute(cacheKey, data);
              return { id: dest.id, info: data };
            }
          } catch (err) {
            console.error(`Failed to get route for ${dest.id}:`, err);
          }

          // Fallback
          const fallback = getFallbackRouteInfo(originLat, originLng, dest.lat, dest.lng);
          return { id: dest.id, info: fallback };
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ id, info }) => {
          results[id] = info;
        });
      }

      setRoutes(results);
      setIsLoading(false);
    };

    fetchRoutes();
  }, [originLat, originLng, destinations, enabled]);

  return { routes, isLoading };
};

// Format travel duration for display
export const formatTravelDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `~${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
};

export default useRouteInfo;
