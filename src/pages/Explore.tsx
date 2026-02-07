import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, SlidersHorizontal, Star, Navigation2, 
  Filter, X, ArrowUpDown, Map, List, Loader2, LocateFixed,
  Scissors, Sparkles, Heart, Palette, User, Droplets, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SalonCard from '@/components/SalonCard';
import MobileNav from '@/components/MobileNav';
import { FloatingSalonIcons } from '@/components/FloatingSalonIcons';
import RouteView from '@/components/RouteView';
import LocationSelector from '@/components/LocationSelector';
import { useSalons } from '@/hooks/useData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouteInfo } from '@/hooks/useRouteInfo';
import { mockSalons } from '@/lib/mock-data';
import { toast } from 'sonner';
import { Salon } from '@/types';

// Lazy load MapView for better performance
const MapView = lazy(() => import('@/components/MapView'));

const categories = [
  { name: 'All', icon: Sparkles },
  { name: 'Hair', icon: Scissors },
  { name: 'Nails', icon: Palette },
  { name: 'Spa', icon: Heart },
  { name: 'Makeup', icon: Sparkles },
  { name: 'Barber', icon: User },
  { name: 'Skincare', icon: Droplets },
];

type SortOption = 'distance' | 'rating' | 'popular';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [minRating, setMinRating] = useState<number>(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  
  // Location hierarchy filter state
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  
  // In-app route drawer state
  const [selectedSalonForRoute, setSelectedSalonForRoute] = useState<(Salon & { distance?: number | null; formattedDistance?: string }) | null>(null);
  const [showRouteDrawer, setShowRouteDrawer] = useState(false);
  
  const { data: salonsData, isLoading } = useSalons('approved');
  const { 
    latitude, 
    longitude, 
    loading: locationLoading, 
    error: locationError,
    requestLocation,
    calculateDistance,
    formatDistance,
    openNavigation,
    permission 
  } = useGeolocation();

  // Fetch route info for selected salon
  const { routeInfo, isLoading: routeLoading } = useRouteInfo({
    originLat: latitude,
    originLng: longitude,
    destLat: selectedSalonForRoute?.latitude ?? null,
    destLng: selectedSalonForRoute?.longitude ?? null,
    enabled: showRouteDrawer && !!selectedSalonForRoute && !!latitude && !!longitude,
  });
  
  // Handler for showing in-app route
  const handleShowRoute = (salon: Salon & { distance?: number | null; formattedDistance?: string }) => {
    setSelectedSalonForRoute(salon);
    setShowRouteDrawer(true);
  };

  const handleCloseRouteDrawer = () => {
    setShowRouteDrawer(false);
    // Clear selected salon after animation
    setTimeout(() => setSelectedSalonForRoute(null), 300);
  };
  
  // Request location on mount
  useEffect(() => {
    if (permission !== 'denied') {
      requestLocation();
    }
  }, []);

  // Use mock data if no real data
  const salons = salonsData && salonsData.length > 0 ? salonsData : mockSalons;

  // Calculate distances and sort salons
  const processedSalons = useMemo(() => {
    let result = salons.map((salon: any) => {
      let distance: number | null = null;
      
      if (latitude && longitude && salon.latitude && salon.longitude) {
        distance = calculateDistance(salon.latitude, salon.longitude);
      }
      
      return {
        ...salon,
        distance,
      };
    });

    // Filter by search
    result = result.filter((salon: any) => {
      const matchesSearch =
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Filter by location hierarchy
    if (selectedTown) {
      result = result.filter((salon: any) => salon.town_id === selectedTown);
    } else if (selectedDistrict) {
      result = result.filter((salon: any) => salon.district_id === selectedDistrict);
    } else if (selectedProvince) {
      result = result.filter((salon: any) => salon.province_id === selectedProvince);
    }

    // Filter by distance
    if (latitude && longitude) {
      result = result.filter((salon: any) => {
        if (salon.distance === null) return true; // Include salons without coordinates
        return salon.distance <= maxDistance;
      });
    }

    // Filter by rating
    result = result.filter((salon: any) => (salon.rating || 0) >= minRating);

    // Sort
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'distance':
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [salons, searchQuery, latitude, longitude, maxDistance, minRating, sortBy, selectedProvince, selectedDistrict, selectedTown, calculateDistance]);

  const handleLocationRequest = () => {
    requestLocation();
    if (locationError) {
      toast.error(locationError);
    }
  };

  const clearFilters = () => {
    setMaxDistance(50);
    setMinRating(0);
    setOpenNowOnly(false);
    setSortBy('distance');
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedTown(null);
  };

  const hasActiveFilters = maxDistance < 50 || minRating > 0 || openNowOnly || selectedProvince || selectedDistrict || selectedTown;
  const hasLocationFilter = selectedProvince || selectedDistrict || selectedTown;

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Hero Glass Overlay - Same as Home */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 pointer-events-none" />
      
      {/* Static Decorative Orbs - Same as Home */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-purple-400/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-10 w-[350px] h-[350px] bg-pink-400/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 left-1/3 w-[300px] h-[300px] bg-orange-300/10 rounded-full blur-[70px]" />
      </div>

      {/* Floating Salon Icons - Same as Home */}
      <FloatingSalonIcons />
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/50 pt-safe">
        <div className="container mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search salons, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-24 h-12 glass-card border-border/50"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* View Toggle */}
                <div className="hidden sm:flex border border-border/50 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2 rounded-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2 rounded-none"
                    onClick={() => setViewMode('map')}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Filters */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
                    <SheetHeader>
                      <div className="flex items-center justify-between">
                        <SheetTitle className="font-serif">Filters & Sort</SheetTitle>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear All
                          </Button>
                        )}
                      </div>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-6 pb-6 overflow-y-auto max-h-[55vh]">
                      {/* Location Filter */}
                      <Collapsible open={locationFilterOpen} onOpenChange={setLocationFilterOpen}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Filter by Location</span>
                              {hasLocationFilter && (
                                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <SlidersHorizontal className={`h-4 w-4 transition-transform ${locationFilterOpen ? 'rotate-90' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3 px-1">
                          <LocationSelector
                            selectedProvince={selectedProvince}
                            selectedDistrict={selectedDistrict}
                            selectedTown={selectedTown}
                            onProvinceChange={setSelectedProvince}
                            onDistrictChange={setSelectedDistrict}
                            onTownChange={setSelectedTown}
                            showClearButton={true}
                          />
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Sort By */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Sort By</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: 'distance', label: 'Nearest', icon: Navigation2 },
                            { value: 'rating', label: 'Top Rated', icon: Star },
                            { value: 'popular', label: 'Most Popular', icon: Heart },
                          ].map((option) => (
                            <Button
                              key={option.value}
                              variant={sortBy === option.value ? 'default' : 'outline'}
                              size="sm"
                              className="gap-2"
                              onClick={() => setSortBy(option.value as SortOption)}
                            >
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Distance Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Maximum Distance</Label>
                          <span className="text-sm text-primary font-medium">{maxDistance} km</span>
                        </div>
                        <Slider
                          value={[maxDistance]}
                          onValueChange={([value]) => setMaxDistance(value)}
                          min={1}
                          max={50}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1 km</span>
                          <span>50 km</span>
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Minimum Rating</Label>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="text-sm font-medium">{minRating}+</span>
                          </div>
                        </div>
                        <Slider
                          value={[minRating]}
                          onValueChange={([value]) => setMinRating(value)}
                          min={0}
                          max={5}
                          step={0.5}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Any</span>
                          <span>5.0</span>
                        </div>
                      </div>

                      {/* Open Now Toggle */}
                      <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl">
                        <Label className="text-sm font-medium">Open Now Only</Label>
                        <Switch
                          checked={openNowOnly}
                          onCheckedChange={setOpenNowOnly}
                        />
                      </div>

                      {/* Apply Button */}
                      <Button 
                        className="w-full h-12 mt-4"
                        onClick={() => setFiltersOpen(false)}
                      >
                        Show {processedSalons.length} Results
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Location Bar */}
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary px-2"
                onClick={handleLocationRequest}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4 text-primary" />
                )}
                {latitude && longitude ? (
                  <span className="text-foreground">Your Location</span>
                ) : locationError ? (
                  <span className="text-destructive text-xs">Enable Location</span>
                ) : (
                  <span>Find Nearby</span>
                )}
              </Button>
              
              {latitude && longitude && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  <Navigation2 className="h-3 w-3 mr-1" />
                  Location Active
                </Badge>
              )}
            </div>

            {/* Categories - Horizontal Scrollable */}
            <div className="-mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`snap-start flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'bg-muted/50 text-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {processedSalons.length} salon{processedSalons.length !== 1 ? 's' : ''} found
            {latitude && longitude && sortBy === 'distance' && (
              <span className="text-primary ml-1">• Sorted by distance</span>
            )}
          </p>
          
          {/* Mobile View Toggle */}
          <div className="flex sm:hidden border border-border/50 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid gap-4"
                >
                  {processedSalons.map((salon: any, index: number) => (
                    <motion.div
                      key={salon.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <SalonCard 
                        salon={{
                          ...salon,
                          // Pass formatted distance
                          formattedDistance: salon.distance !== null 
                            ? formatDistance(salon.distance) 
                            : undefined,
                        }}
                        onShowRoute={handleShowRoute}
                        userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        ) : (
          /* Map View with Leaflet */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden border border-border/50"
          >
            <div className="h-[60vh] min-h-[400px]">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center bg-muted/30">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              }>
                <MapView
                  salons={processedSalons}
                  userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                  onSalonSelect={(salon) => {
                    console.log('Selected salon:', salon.name);
                  }}
                  onShowRoute={handleShowRoute}
                />
              </Suspense>
            </div>
          </motion.div>
        )}

        {!isLoading && processedSalons.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No salons found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <MobileNav />

      {/* In-App Route Drawer */}
      <Drawer open={showRouteDrawer} onOpenChange={setShowRouteDrawer}>
        <DrawerContent className="h-[95vh] max-h-[95vh]">
          <DrawerHeader className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseRouteDrawer}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DrawerTitle className="font-serif text-lg">
              Route to {selectedSalonForRoute?.name || 'Salon'}
            </DrawerTitle>
          </DrawerHeader>
          
          {selectedSalonForRoute && latitude && longitude && (
            <RouteView
              userLocation={{ lat: latitude, lng: longitude }}
              salon={selectedSalonForRoute}
              routeInfo={routeInfo}
              isRouteLoading={routeLoading}
              onClose={handleCloseRouteDrawer}
              onStartNavigation={() => {
                if (selectedSalonForRoute.latitude && selectedSalonForRoute.longitude) {
                  openNavigation(selectedSalonForRoute.latitude, selectedSalonForRoute.longitude, selectedSalonForRoute.name);
                }
              }}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Explore;
