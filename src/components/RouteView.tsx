import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Navigation2, MapPin, Clock, ExternalLink, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapView from '@/components/MapView';
import RouteInfoCard from '@/components/RouteInfoCard';
import { RouteInfo, formatTravelDuration } from '@/hooks/useRouteInfo';
import { Salon } from '@/types';
import { format, addMinutes } from 'date-fns';

interface SalonWithDistance extends Salon {
  distance?: number | null;
  formattedDistance?: string;
}

interface RouteViewProps {
  salon: SalonWithDistance;
  userLocation: { lat: number; lng: number };
  routeInfo: RouteInfo | null;
  isRouteLoading?: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
}

const RouteView = ({
  salon,
  userLocation,
  routeInfo,
  isRouteLoading = false,
  onClose,
  onStartNavigation,
}: RouteViewProps) => {
  // Calculate estimated arrival time
  const estimatedArrival = routeInfo 
    ? addMinutes(new Date(), routeInfo.durationMinutes)
    : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Uber/PickMe Style */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-background/95 backdrop-blur-lg border-b border-border/50 p-4"
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full"
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Route to</p>
            <h1 className="font-semibold text-lg truncate">{salon.name}</h1>
          </div>

          {routeInfo?.source === 'osrm' && (
            <Badge variant="secondary" className="shrink-0">
              <Route className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>

        {/* Quick Stats Bar */}
        {routeInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30"
          >
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Clock className="h-4 w-4" />
              {formatTravelDuration(routeInfo.durationMinutes)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Navigation2 className="h-4 w-4" />
              {routeInfo.distanceKm.toFixed(1)} km
            </div>
            {estimatedArrival && (
              <div className="flex items-center gap-2 text-accent ml-auto">
                <span className="text-sm">Arrive by</span>
                <span className="font-semibold">{format(estimatedArrival, 'h:mm a')}</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.header>

      {/* Full Map View */}
      <div className="flex-1 relative">
        <MapView
          salons={[salon]}
          userLocation={userLocation}
          showRoute={true}
          routeInfo={routeInfo}
          selectedSalonId={salon.id}
        />

        {/* Route Loading Overlay */}
        {isRouteLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Finding best route...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Card - Uber/PickMe Style */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 bg-background border-t border-border/50 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        {/* Route Summary */}
        <div className="flex items-center gap-4 mb-4">
          {/* From */}
          <div className="flex items-center gap-2 flex-1">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-sm text-muted-foreground truncate">Your Location</span>
          </div>
          
          {/* Route Line */}
          <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-accent" />
          
          {/* To */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-sm font-medium truncate">{salon.name}</span>
            <MapPin className="h-4 w-4 text-accent shrink-0" />
          </div>
        </div>

        {/* Duration/Distance Display */}
        {routeInfo && (
          <div className="flex items-center justify-center gap-6 py-3 mb-4 bg-muted/30 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatTravelDuration(routeInfo.durationMinutes).replace('~', '')}
              </p>
              <p className="text-xs text-muted-foreground">Travel Time</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {routeInfo.distanceKm.toFixed(1)} km
              </p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline"
            className="flex-1 h-12"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            className="flex-1 h-12 gap-2 shadow-lg"
            onClick={onStartNavigation}
          >
            <ExternalLink className="h-5 w-5" />
            Open in Maps
          </Button>
        </div>

        {/* Fastest Route Indicator */}
        {routeInfo && (
          <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Car className="h-3.5 w-3.5" />
            {routeInfo.source === 'osrm' 
              ? 'Fastest route via roads' 
              : 'Estimated route'}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default RouteView;
