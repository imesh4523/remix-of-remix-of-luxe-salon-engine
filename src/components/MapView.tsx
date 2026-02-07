import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { Icon, DivIcon, LatLngBounds } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation2, MapPin, Star, Clock, ExternalLink, X, Locate, ZoomIn, ZoomOut, Route, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Salon } from '@/types';
import { formatCurrency, formatTravelDuration } from '@/lib/format';
import { useRouteInfo, RouteInfo } from '@/hooks/useRouteInfo';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Sri Lanka center coordinates
const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;

interface SalonWithDistance extends Salon {
  distance?: number | null;
  formattedDistance?: string;
}

interface MapViewProps {
  salons: SalonWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  onSalonSelect?: (salon: SalonWithDistance) => void;
  onNavigate?: (lat: number, lng: number, name: string) => void;
  // New prop for in-app route display - primary action
  onShowRoute?: (salon: SalonWithDistance) => void;
  // Props for route display
  showRoute?: boolean;
  routeInfo?: RouteInfo | null;
  selectedSalonId?: string | null;
}

// Custom marker icons
const createUserIcon = () => {
  return new DivIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8));
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 8px hsl(var(--primary)/0.2);
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createSalonIcon = (isSelected: boolean = false) => {
  return new DivIcon({
    className: 'salon-marker',
    html: `
      <div style="
        width: ${isSelected ? '40px' : '32px'};
        height: ${isSelected ? '40px' : '32px'};
        background: ${isSelected ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' : 'hsl(var(--card))'};
        border: 2px solid ${isSelected ? 'white' : 'hsl(var(--primary))'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: all 0.3s ease;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '20' : '16'}" height="${isSelected ? '20' : '16'}" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? 'white' : 'hsl(var(--primary))'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/>
          <path d="M17 7A5 5 0 0 0 7 7"/>
          <path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"/>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
  });
};

// Map controller component
const MapController = ({ 
  userLocation, 
  salons,
  onCenterUser 
}: { 
  userLocation: { lat: number; lng: number } | null;
  salons: SalonWithDistance[];
  onCenterUser: () => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (salons.length > 0) {
      const bounds = new LatLngBounds(
        salons
          .filter(s => s.latitude && s.longitude)
          .map(s => [s.latitude!, s.longitude!] as [number, number])
      );
      
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation, salons, map]);

  return null;
};

const MapView = ({ 
  salons, 
  userLocation, 
  onSalonSelect, 
  onNavigate,
  onShowRoute,
  showRoute = false,
  routeInfo,
  selectedSalonId,
}: MapViewProps) => {
  const [selectedSalon, setSelectedSalon] = useState<SalonWithDistance | null>(null);
  const mapRef = useRef<any>(null);

  // Convert OSRM coordinates [lng, lat] to Leaflet [lat, lng]
  const routeCoordinates = routeInfo?.geometry?.coordinates?.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  ) || [];

  const handleMarkerClick = (salon: SalonWithDistance) => {
    setSelectedSalon(salon);
    onSalonSelect?.(salon);
  };

  const handleCenterUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  };

  // Handle navigation button - prefer in-app route, fallback to external maps
  const handleNavigate = (salon: SalonWithDistance) => {
    if (salon.latitude && salon.longitude) {
      if (onShowRoute) {
        onShowRoute(salon);
      } else if (onNavigate) {
        onNavigate(salon.latitude, salon.longitude, salon.name);
      }
    }
  };

  const validSalons = salons.filter(s => s.latitude && s.longitude);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      {/* Add custom CSS for marker animations */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 0 hsl(var(--primary)/0.4); }
          70% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 20px hsl(var(--primary)/0); }
          100% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 0 hsl(var(--primary)/0); }
        }
        .leaflet-container {
          background: hsl(var(--muted));
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--card));
          border-radius: 1rem;
          border: 1px solid hsl(var(--border)/0.5);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
        }
        .leaflet-popup-tip {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border)/0.5);
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)/0.5) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(var(--muted)) !important;
        }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={userLocation ? [userLocation.lat, userLocation.lng] : SRI_LANKA_CENTER}
        zoom={userLocation ? 13 : DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          userLocation={userLocation} 
          salons={validSalons}
          onCenterUser={handleCenterUser}
        />

        {/* User location marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={500}
              pathOptions={{
                color: 'hsl(var(--primary))',
                fillColor: 'hsl(var(--primary))',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={createUserIcon()}
            >
              <Popup>
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <Locate className="h-4 w-4 text-primary" />
                    Your Location
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Route Polyline - Draw driving route between user and selected salon */}
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Salon markers */}
        {validSalons.map((salon) => (
          <Marker
            key={salon.id}
            position={[salon.latitude!, salon.longitude!]}
            icon={createSalonIcon(selectedSalon?.id === salon.id)}
            eventHandlers={{
              click: () => handleMarkerClick(salon),
            }}
          >
            <Popup>
              <div className="p-0 min-w-[240px]">
                {/* Salon image */}
                <div className="relative h-28 overflow-hidden rounded-t-xl">
                  <img
                    src={salon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h4 className="text-white font-semibold text-sm truncate">{salon.name}</h4>
                  </div>
                  <Badge className="absolute top-2 right-2 gap-1 bg-black/60 backdrop-blur text-white border-none text-xs">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {(salon.rating || 0).toFixed(1)}
                  </Badge>
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{salon.address || salon.city}</span>
                  </div>
                  
                  {salon.distance !== undefined && salon.distance !== null && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <Navigation2 className="h-3 w-3" />
                        {salon.formattedDistance || `${salon.distance.toFixed(1)} km`}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTravelDuration(Math.round((salon.distance / 30) * 60))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-1">
                    <Link to={`/salon/${salon.id}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs h-8">
                        View Salon
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2"
                      onClick={() => handleNavigate(salon)}
                    >
                      <Navigation2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Custom controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {userLocation && (
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg glass-card"
            onClick={handleCenterUser}
          >
            <Locate className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Salon count indicator */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Badge variant="secondary" className="glass-card backdrop-blur-md gap-1.5 px-3 py-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          {validSalons.length} salon{validSalons.length !== 1 ? 's' : ''} on map
        </Badge>
      </div>

      {/* Selected salon card - Mobile */}
      <AnimatePresence>
        {selectedSalon && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-20 left-4 right-4 z-[1000] sm:hidden"
          >
            <div className="glass-card p-3 rounded-xl">
              <div className="flex gap-3">
                <img
                  src={selectedSalon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200'}
                  alt={selectedSalon.name}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">{selectedSalon.name}</h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 -mt-1 -mr-1"
                      onClick={() => setSelectedSalon(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      {(selectedSalon.rating || 0).toFixed(1)}
                    </div>
                    {selectedSalon.distance !== undefined && selectedSalon.distance !== null && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-medium">
                          {selectedSalon.formattedDistance || `${selectedSalon.distance.toFixed(1)} km`}
                        </span>
                        <span>•</span>
                        <span>{formatTravelDuration(Math.round((selectedSalon.distance / 30) * 60))}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link to={`/salon/${selectedSalon.id}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs h-7">View</Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2"
                      onClick={() => handleNavigate(selectedSalon)}
                    >
                      <Navigation2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
