import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permission: PermissionState | null;
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void;
  calculateDistance: (lat: number, lng: number) => number | null;
  formatDistance: (km: number) => string;
  openNavigation: (lat: number, lng: number, name?: string) => void;
}

// Haversine formula to calculate distance between two points
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
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

export const useGeolocation = (): UseGeolocationReturn => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permission: null,
  });

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setState((prev) => ({ ...prev, permission: result.state }));
          
          result.addEventListener('change', () => {
            setState((prev) => ({ ...prev, permission: result.state }));
          });
        })
        .catch(() => {
          // Permission API not supported
        });
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permission: 'granted',
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable it in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
          permission: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permission,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  // Auto-request on mount if permission is granted
  useEffect(() => {
    if (state.permission === 'granted' && !state.latitude) {
      requestLocation();
    }
  }, [state.permission, state.latitude, requestLocation]);

  const calculateDistance = useCallback(
    (lat: number, lng: number): number | null => {
      if (state.latitude === null || state.longitude === null) {
        return null;
      }
      return haversineDistance(state.latitude, state.longitude, lat, lng);
    },
    [state.latitude, state.longitude]
  );

  const formatDistance = useCallback((km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }, []);

  const openNavigation = useCallback(
    (lat: number, lng: number, name?: string) => {
      const destination = name ? encodeURIComponent(name) : `${lat},${lng}`;
      
      // Check if on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Try to open native maps app
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isIOS) {
          // Apple Maps with fallback to Google Maps
          window.open(
            `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`,
            '_blank'
          );
        } else {
          // Google Maps for Android
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            '_blank'
          );
        }
      } else {
        // Desktop - open Google Maps in new tab
        if (state.latitude && state.longitude) {
          window.open(
            `https://www.google.com/maps/dir/${state.latitude},${state.longitude}/${lat},${lng}`,
            '_blank'
          );
        } else {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            '_blank'
          );
        }
      }
    },
    [state.latitude, state.longitude]
  );

  return {
    ...state,
    requestLocation,
    calculateDistance,
    formatDistance,
    openNavigation,
  };
};

export default useGeolocation;
