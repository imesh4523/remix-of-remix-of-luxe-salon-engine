import { motion } from 'framer-motion';
import { Car, MapPin, Navigation2, Clock, Route, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTravelDuration, RouteInfo } from '@/hooks/useRouteInfo';
import { format, addMinutes } from 'date-fns';

interface RouteInfoCardProps {
  routeInfo: RouteInfo | null;
  salonName: string;
  onStartNavigation?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

const RouteInfoCard = ({
  routeInfo,
  salonName,
  onStartNavigation,
  onClose,
  isLoading = false,
}: RouteInfoCardProps) => {
  // Calculate estimated arrival time
  const estimatedArrival = routeInfo 
    ? addMinutes(new Date(), routeInfo.durationMinutes)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Trip Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Driving to</p>
            <h3 className="font-semibold truncate">{salonName}</h3>
          </div>
          {routeInfo?.source === 'osrm' && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Live Route
            </Badge>
          )}
        </div>
      </div>

      {/* Trip Stats */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : routeInfo ? (
          <>
            {/* Duration & Distance - Large Display */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                  <Clock className="h-7 w-7" />
                  {formatTravelDuration(routeInfo.durationMinutes).replace('~', '')}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Travel Time</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                  <Navigation2 className="h-7 w-7 text-accent" />
                  {routeInfo.distanceKm.toFixed(1)} km
                </div>
                <p className="text-sm text-muted-foreground mt-1">Distance</p>
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Your Location
                </span>
                <span className="text-muted-foreground">Now</span>
              </div>
              
              <div className="flex items-center gap-2 pl-1">
                <div className="h-8 w-0.5 bg-gradient-to-b from-primary to-accent ml-0.5" />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  {salonName}
                </span>
                {estimatedArrival && (
                  <span className="font-semibold text-primary">
                    {format(estimatedArrival, 'h:mm a')}
                  </span>
                )}
              </div>
            </div>

            {/* Fastest Route Indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Route className="h-3.5 w-3.5" />
              {routeInfo.source === 'osrm' 
                ? 'Fastest route via roads' 
                : 'Estimated via straight line'}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Unable to calculate route
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0 space-y-2">
        {onStartNavigation && (
          <Button 
            className="w-full h-12 text-base gap-2 shadow-lg"
            onClick={onStartNavigation}
          >
            <ExternalLink className="h-5 w-5" />
            Start Navigation
          </Button>
        )}
        {onClose && (
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default RouteInfoCard;
