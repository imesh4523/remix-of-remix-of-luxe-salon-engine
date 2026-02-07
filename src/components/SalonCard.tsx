import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Navigation2, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Salon } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouteInfo, formatTravelDuration } from '@/hooks/useRouteInfo';
import { generateSlug } from '@/lib/slug';

interface SalonCardProps {
  salon: Salon & { 
    distance?: number | null;
    formattedDistance?: string;
  };
  index?: number;
  userLocation?: { lat: number; lng: number } | null;
  onShowRoute?: (salon: Salon & { distance?: number | null; formattedDistance?: string }) => void;
}

export const SalonCard = forwardRef<HTMLDivElement, SalonCardProps>(({ salon, index = 0, userLocation, onShowRoute }, ref) => {
  const { openNavigation, latitude, longitude } = useGeolocation();

  // Use provided userLocation or from hook
  const originLat = userLocation?.lat ?? latitude;
  const originLng = userLocation?.lng ?? longitude;

  // Fetch real route info
  const { routeInfo, isLoading: routeLoading } = useRouteInfo({
    originLat,
    originLng,
    destLat: salon.latitude ?? null,
    destLng: salon.longitude ?? null,
    enabled: !!(originLat && originLng && salon.latitude && salon.longitude),
  });

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (salon.latitude && salon.longitude) {
      // Use in-app route callback if provided, otherwise fallback to external maps
      if (onShowRoute) {
        onShowRoute(salon);
      } else {
        openNavigation(salon.latitude, salon.longitude, salon.name);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/salon/${salon.slug || generateSlug(salon.name)}`}>
        <div className="glass-card group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-glow-rose hover:border-primary/30">
          {/* Image */}
          <div className="relative h-36 sm:h-48 overflow-hidden">
            <img
              src={salon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'}
              alt={salon.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Rating Badge */}
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
              <Badge className="glass-card backdrop-blur-md border-none gap-1 text-xs px-2 py-0.5">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {(salon.rating || 0).toFixed(1)}
              </Badge>
            </div>

            {/* Distance Badge */}
            {(salon.formattedDistance || salon.distance !== undefined) && (
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1">
                <Badge variant="secondary" className="glass-card backdrop-blur-md border-none gap-1 text-xs px-2 py-0.5 bg-primary/80 text-primary-foreground">
                  <Navigation2 className="h-3 w-3" />
                  {salon.formattedDistance || (salon.distance !== null ? `${salon.distance.toFixed(1)} km` : '')}
                </Badge>
                
                {/* Travel Duration Badge */}
                {routeLoading ? (
                  <Skeleton className="h-5 w-16 rounded-full" />
                ) : routeInfo ? (
                  <Badge variant="secondary" className="glass-card backdrop-blur-md border-none gap-1 text-xs px-2 py-0.5 bg-accent/80 text-accent-foreground">
                    <Car className="h-3 w-3" />
                    {formatTravelDuration(routeInfo.durationMinutes)}
                  </Badge>
                ) : null}
              </div>
            )}

            {/* Navigate Button */}
            {salon.latitude && salon.longitude && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2 gap-1 glass-card backdrop-blur-md border-none opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNavigate}
              >
                <Navigation2 className="h-4 w-4" />
                <span className="hidden sm:inline">Directions</span>
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {salon.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {salon.town?.name_en 
                      ? `${salon.town.name_en}${salon.district?.name_en ? `, ${salon.district.name_en}` : ''}`
                      : salon.address || salon.city}
                  </span>
                </p>
              </div>
              {salon.logo && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden ring-2 ring-primary/20 shrink-0">
                  <img
                    src={salon.logo}
                    alt={`${salon.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {salon.description ? (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {salon.description}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                No description available
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Open Now</span>
              </div>
              <span className="text-primary font-medium">
                {salon.review_count || 0} reviews
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

SalonCard.displayName = 'SalonCard';

export default SalonCard;
