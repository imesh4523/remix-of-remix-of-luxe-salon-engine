import { useState, useMemo, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Phone, Mail, Star, Clock, 
  ChevronRight, Check, Navigation2, ExternalLink, X, Calendar as CalendarIcon,
  Route, Map, Car
} from 'lucide-react';
import { format, addDays, addMinutes, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Navbar } from '@/components/Navbar';
import { ServiceCard } from '@/components/ServiceCard';
import { StaffCard } from '@/components/StaffCard';
import { ReviewCard } from '@/components/ReviewCard';
import { BookingSteps } from '@/components/BookingSteps';
import { TimeSlotButton } from '@/components/TimeSlotButton';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { BookNowBar } from '@/components/BookNowBar';
import { Skeleton } from '@/components/ui/skeleton';
import RouteView from '@/components/RouteView';
import { useSalon, useSalonBySlug, useServices, useStaff, useReviews, useCreateBooking } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouteInfo, formatTravelDuration } from '@/hooks/useRouteInfo';
import { useBookedSlots, isSlotAvailable } from '@/hooks/useBookedSlots';
import { mockSalons, mockServices, mockStaff, mockReviews, generateTimeSlots } from '@/lib/mock-data';
import { generateSlug } from '@/lib/slug';
import { Service, Staff, BookingStep, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

const bookingSteps: BookingStep[] = [
  { step: 'service', label: 'Service' },
  { step: 'staff', label: 'Stylist' },
  { step: 'date', label: 'Date' },
  { step: 'time', label: 'Time' },
  { step: 'payment', label: 'Payment' },
  { step: 'confirm', label: 'Confirm' },
];

// Time Slot Section component with real-time availability - Memoized for performance
interface TimeSlotSectionProps {
  selectedDate: Date | undefined;
  selectedStaff: Staff | null;
  selectedService: Service | null;
  salonId: string;
  timeSlots: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}



const TimeSlotSection = memo(({
  selectedDate,
  selectedStaff,
  selectedService,
  salonId,
  timeSlots,
  selectedTime,
  onSelectTime,
}: TimeSlotSectionProps) => {
  const { data: bookedSlots, isLoading } = useBookedSlots(
    selectedStaff?.id,
    salonId,
    selectedDate
  );

  const serviceDuration = selectedService?.duration_minutes || 30;

  return (
    <div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
        Time slots for {selectedDate && format(selectedDate, 'MMM d')}
      </p>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {timeSlots.map((time) => {
            const available = isSlotAvailable(time, bookedSlots || [], serviceDuration);
            return (
              <TimeSlotButton
                key={time}
                time={time}
                available={available}
                isSelected={selectedTime === time}
                onSelect={onSelectTime}
              />
            );
          })}
        </div>
      )}
      
      {/* Legend for time slot status */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-card border border-border/50" />
          <span className="text-[10px] text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" />
          <span className="text-[10px] text-muted-foreground">Already Booked</span>
        </div>
      </div>
    </div>
  );
});

TimeSlotSection.displayName = 'TimeSlotSection';

// Booking Panel Content - Reusable for both desktop sidebar and mobile sheet
interface BookingPanelProps {
  currentStep: BookingStep['step'];
  services: Service[];
  staff: Staff[];
  selectedService: Service | null;
  selectedStaff: Staff | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedPaymentMethod: PaymentMethod;
  timeSlots: string[];
  salonId: string;
  user: any;
  isBooking: boolean;
  onServiceSelect: (service: Service) => void;
  onStaffSelect: (staff: Staff) => void;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onConfirm: () => void;
  canProceed: () => boolean;
  onClose?: () => void;
}

const BookingPanel = ({
  currentStep,
  services,
  staff,
  selectedService,
  selectedStaff,
  selectedDate,
  selectedTime,
  selectedPaymentMethod,
  timeSlots,
  salonId,
  user,
  isBooking,
  onServiceSelect,
  onStaffSelect,
  onDateSelect,
  onTimeSelect,
  onPaymentMethodChange,
  onNextStep,
  onPrevStep,
  onConfirm,
  canProceed,
  onClose,
}: BookingPanelProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header with close button for mobile */}
      {onClose && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg sm:text-xl font-semibold">Book Appointment</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {!onClose && (
        <h3 className="font-serif text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Book Appointment</h3>
      )}

      <BookingSteps steps={bookingSteps} currentStep={currentStep} />

      <div className="mt-4 sm:mt-6 flex-1 overflow-y-auto min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {currentStep === 'service' && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  Select a service
                </p>
                {services.map((service: Service) => (
                  <div
                    key={service.id}
                    onClick={() => onServiceSelect(service)}
                    className={`p-2 sm:p-3 rounded-xl cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{service.name}</span>
                      <span className="text-primary text-sm shrink-0">{formatCurrency(service.price)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {service.duration_minutes} min
                    </span>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 'staff' && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  Choose your stylist
                </p>
                {staff.map((staffMember: Staff) => (
                  <StaffCard
                    key={staffMember.id}
                    staff={staffMember}
                    isSelected={selectedStaff?.id === staffMember.id}
                    onSelect={onStaffSelect}
                  />
                ))}
              </div>
            )}

            {currentStep === 'date' && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  Select date
                </p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  className="rounded-xl border border-border/50 text-sm"
                />
              </div>
            )}

            {currentStep === 'time' && (
              <TimeSlotSection
                selectedDate={selectedDate}
                selectedStaff={selectedStaff}
                selectedService={selectedService}
                salonId={salonId}
                timeSlots={timeSlots}
                selectedTime={selectedTime}
                onSelectTime={onTimeSelect}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentMethodSelector
                value={selectedPaymentMethod}
                onChange={onPaymentMethodChange}
              />
            )}

            {currentStep === 'confirm' && (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  Review booking
                </p>
                {!user && (
                  <div className="p-2 sm:p-3 bg-accent/10 rounded-xl border border-accent/30 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-accent">
                      <Link to="/auth" className="underline font-medium">Sign in</Link> to book
                    </p>
                  </div>
                )}
                <div className="space-y-2 sm:space-y-3 text-sm">
                  <div className="flex justify-between p-2 sm:p-3 bg-muted/30 rounded-xl gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">Service</span>
                    <span className="font-medium text-xs sm:text-sm truncate text-right">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between p-2 sm:p-3 bg-muted/30 rounded-xl gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">Stylist</span>
                    <span className="font-medium text-xs sm:text-sm truncate text-right">{selectedStaff?.name}</span>
                  </div>
                  <div className="flex justify-between p-2 sm:p-3 bg-muted/30 rounded-xl">
                    <span className="text-muted-foreground text-xs sm:text-sm">Date</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 sm:p-3 bg-muted/30 rounded-xl">
                    <span className="text-muted-foreground text-xs sm:text-sm">Time</span>
                    <span className="font-medium text-xs sm:text-sm">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between p-2 sm:p-3 bg-muted/30 rounded-xl">
                    <span className="text-muted-foreground text-xs sm:text-sm">Payment</span>
                    <span className="font-medium text-xs sm:text-sm capitalize">
                      {selectedPaymentMethod === 'cash' ? 'Cash at Salon' : 
                       selectedPaymentMethod === 'crypto' ? 'Crypto' : 'Pay Now'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/30">
                    <span className="font-medium text-xs sm:text-sm">Total</span>
                    <span className="text-base sm:text-lg font-bold text-primary">
                      {selectedService ? formatCurrency(selectedService.price) : 'Rs 0'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-border/50">
        {currentStep !== 'service' && (
          <Button
            variant="outline"
            onClick={onPrevStep}
            className="flex-1 text-sm"
            size="sm"
          >
            Back
          </Button>
        )}
        {currentStep !== 'confirm' ? (
          <Button
            onClick={onNextStep}
            disabled={!canProceed()}
            className="flex-1 gap-1 sm:gap-2 text-sm"
            size="sm"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onConfirm}
            disabled={isBooking || !user}
            className="flex-1 gap-1 sm:gap-2 shadow-glow-rose text-sm"
            size="sm"
          >
            {isBooking ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Skeleton Loading Component for instant feedback
const SalonDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Hero Skeleton */}
    <div className="relative h-56 sm:h-72 lg:h-80">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Back button skeleton */}
      <div className="absolute top-4 left-4 z-10">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
    
    {/* Content Skeleton */}
    <div className="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Salon Info Card */}
          <div className="glass-card p-4 sm:p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
          
          {/* Tabs Skeleton */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30">
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar Skeleton (Desktop) */}
        <div className="hidden lg:block w-80 xl:w-96">
          <div className="glass-card p-6 space-y-4 sticky top-24">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-8 flex-1 rounded-full" />
              ))}
            </div>
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
    
    {/* Bottom Bar Skeleton (Mobile) */}
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
      <div className="glass-card border-t border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  </div>
);

const SalonDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openNavigation, calculateDistance, formatDistance, latitude, longitude } = useGeolocation();
  
  // Fetch real data by slug
  const { data: salonData, isLoading: salonLoading } = useSalonBySlug(slug || '');
  
  // Get salon ID for related queries (from DB or mock data)
  const salonId = salonData?.id || mockSalons.find(s => s.slug === slug)?.id || mockSalons.find(s => generateSlug(s.name) === slug)?.id;
  
  const { data: servicesData, isLoading: servicesLoading } = useServices(salonId);
  const { data: staffData, isLoading: staffLoading } = useStaff(salonId);
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(salonId || '');
  const createBooking = useCreateBooking();

  // Get real route info (travel duration) - moved before early return
  const { routeInfo, isLoading: routeLoading } = useRouteInfo({
    originLat: latitude,
    originLng: longitude,
    destLat: salonData?.latitude ?? null,
    destLng: salonData?.longitude ?? null,
    enabled: !!(latitude && longitude && salonData?.latitude && salonData?.longitude),
  });

  // State for in-app route drawer (Uber/PickMe style) - moved before early return
  const [showRouteDrawer, setShowRouteDrawer] = useState(false);

  // Browse/Booking Mode State - moved before early return
  const [isBookingMode, setIsBookingMode] = useState(false);
  
  // Booking States - moved before early return
  const [currentStep, setCurrentStep] = useState<BookingStep['step']>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [isBooking, setIsBooking] = useState(false);

  const timeSlots = generateTimeSlots();

  // Fallback to mock data if no real data - match by slug
  const mockSalon = mockSalons.find((s) => s.slug === slug) || mockSalons.find((s) => generateSlug(s.name) === slug) || mockSalons[0];
  const salon = salonData || mockSalon;
  const services = servicesData && servicesData.length > 0 ? servicesData : mockServices;
  const staff = staffData && staffData.length > 0 ? staffData : mockStaff;
  const reviews = reviewsData && reviewsData.length > 0 ? reviewsData : mockReviews;

  // Calculate starting price from services
  const startingPrice = useMemo(() => {
    if (services.length === 0) return 0;
    return Math.min(...services.map((s: Service) => s.price));
  }, [services]);

  // Show skeleton immediately while loading
  if (salonLoading) {
    return <SalonDetailSkeleton />;
  }
  
  // Calculate distance to salon
  const salonDistance = salonData?.latitude && salonData?.longitude && latitude && longitude
    ? calculateDistance(salonData.latitude, salonData.longitude)
    : null;

  const handleNavigateToSalon = () => {
    if (salon.latitude && salon.longitude) {
      openNavigation(salon.latitude, salon.longitude, salon.name);
    }
  };

  const handleShowRoute = () => {
    if (latitude && longitude && salon.latitude && salon.longitude) {
      setShowRouteDrawer(true);
    } else {
      toast.error('Location permission required to show route');
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleStaffSelect = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
  };

  const handleNextStep = () => {
    const stepOrder: BookingStep['step'][] = ['service', 'staff', 'date', 'time', 'payment', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const stepOrder: BookingStep['step'][] = ['service', 'staff', 'date', 'time', 'payment', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null;
      case 'staff':
        return selectedStaff !== null;
      case 'date':
        return selectedDate !== undefined;
      case 'time':
        return selectedTime !== null;
      case 'payment':
        return selectedPaymentMethod !== null;
      default:
        return true;
    }
  };

  const handleCloseBooking = () => {
    setIsBookingMode(false);
    // Reset booking state when closing
    setCurrentStep('service');
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setSelectedPaymentMethod('cash');
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book an appointment');
      navigate('/auth');
      return;
    }

    // Check if we're using real data (valid UUIDs) not mock data
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    if (!salonData || !isValidUUID(salon.id)) {
      toast.error('Cannot book - this is demo data. Please select a real salon.');
      return;
    }

    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking steps');
      return;
    }

    // Verify staff and service are from real data
    if (!isValidUUID(selectedStaff.id) || !isValidUUID(selectedService.id)) {
      toast.error('Cannot book with demo data. Please select a real salon with real services.');
      return;
    }

    setIsBooking(true);

    try {
      // Calculate end time
      const startTime = parse(selectedTime, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, selectedService.duration_minutes);
      const endTimeStr = format(endTime, 'HH:mm');

      // Calculate commission using salon's rate (default 7%)
      const commissionRate = (salon.commission_rate || 7) / 100;
      const platformCommission = selectedService.price * commissionRate;
      const vendorPayout = selectedService.price - platformCommission;

      await createBooking.mutateAsync({
        customer_id: user.id,
        salon_id: salon.id,
        staff_id: selectedStaff.id,
        service_id: selectedService.id,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTimeStr,
        total_amount: selectedService.price,
        platform_commission: platformCommission,
        vendor_payout: vendorPayout,
        payment_method: selectedPaymentMethod as 'cash' | 'online', // Cast for DB compatibility
        payment_status: 'pending',
      });

      toast.success('Booking confirmed! Check your email for details.');
      
      // Reset and navigate to bookings
      handleCloseBooking();
      navigate('/bookings');
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsBooking(false);
    }
  };

  const isLoading = salonLoading || servicesLoading || staffLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[50vh] min-h-[300px] sm:min-h-[400px] pt-16">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <>
            <img
              src={salon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200'}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </>
        )}

        <Link
          to="/"
          className="absolute top-20 left-3 sm:left-4 md:left-8 glass-button p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-8">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-3 sm:gap-4"
            >
              {salon.logo && (
                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl overflow-hidden ring-2 sm:ring-4 ring-background shadow-glass shrink-0">
                  <img
                    src={salon.logo}
                    alt={`${salon.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-xl sm:text-3xl md:text-4xl font-bold text-foreground truncate">
                  {salon.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-accent text-accent shrink-0" />
                    <span className="font-medium text-foreground">{salon.rating}</span>
                    <span className="hidden sm:inline">({salon.review_count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{salon.city}</span>
                  </div>
                  {salonDistance !== null && (
                    <div className="flex items-center gap-1 text-primary">
                      <Navigation2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="font-medium">{formatDistance(salonDistance)}</span>
                    </div>
                  )}
                  {/* Travel Duration */}
                  {routeInfo && (
                    <div className="flex items-center gap-1 text-accent">
                      <Car className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="font-medium">{formatTravelDuration(routeInfo.durationMinutes)}</span>
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1">
                    <Clock className="h-4 w-4 shrink-0" />
                    Open Now
                  </div>
                </div>
                
                {/* View Route Button - Shows in-app map */}
                {salon.latitude && salon.longitude && latitude && longitude && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleShowRoute();
                    }}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs sm:text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    <Route className="h-4 w-4" />
                    View Route
                    {routeInfo && (
                      <span className="text-primary/70">• {formatTravelDuration(routeInfo.durationMinutes)}</span>
                    )}
                  </button>
                )}
                
                {/* External Navigation Button - Secondary option */}
                {salon.latitude && salon.longitude && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigateToSalon();
                    }}
                    className="mt-2 ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs sm:text-sm font-medium hover:bg-muted/70 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Maps
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-3 sm:px-4 py-4 sm:py-8 pb-28 lg:pb-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content - Browse Mode */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="glass-card w-full justify-start p-1 overflow-x-auto">
                <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
                <TabsTrigger value="about" className="text-xs sm:text-sm">About</TabsTrigger>
                <TabsTrigger value="team" className="text-xs sm:text-sm">Team</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reviews</TabsTrigger>
              </TabsList>

              {/* Services Tab - Browse Only (No Selection) */}
              <TabsContent value="services" className="mt-6 space-y-4">
                {servicesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  services.map((service: any) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      // No selection in browse mode - just display
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-6"
                >
                  <h3 className="font-serif text-xl font-semibold mb-4">About Us</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {salon.description}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{salon.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{salon.email}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Team Tab - Browse Only (No Selection) */}
              <TabsContent value="team" className="mt-6 space-y-4">
                {staffLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  staff.map((staffMember: any) => (
                    <StaffCard
                      key={staffMember.id}
                      staff={staffMember}
                      // No selection in browse mode - just display
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 space-y-4">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Booking Sidebar - Only visible when booking mode is active on desktop */}
          <AnimatePresence>
            {isBookingMode && (
              <motion.div 
                className="lg:col-span-1 hidden lg:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="glass-card-elevated p-4 sm:p-6 lg:sticky lg:top-24">
                  <BookingPanel
                    currentStep={currentStep}
                    services={services}
                    staff={staff}
                    selectedService={selectedService}
                    selectedStaff={selectedStaff}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    selectedPaymentMethod={selectedPaymentMethod}
                    timeSlots={timeSlots}
                    salonId={salon.id}
                    user={user}
                    isBooking={isBooking}
                    onServiceSelect={handleServiceSelect}
                    onStaffSelect={handleStaffSelect}
                    onDateSelect={setSelectedDate}
                    onTimeSelect={setSelectedTime}
                    onPaymentMethodChange={setSelectedPaymentMethod}
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    onConfirm={handleConfirmBooking}
                    canProceed={canProceed}
                    onClose={handleCloseBooking}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop: Book Now Button - Only in browse mode */}
          {!isBookingMode && (
            <div className="lg:col-span-1 hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card-elevated p-6 lg:sticky lg:top-24"
              >
                <div className="text-center space-y-4">
                  <h3 className="font-serif text-xl font-semibold">Ready to Book?</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse our services and team, then click below to start booking.
                  </p>
                  <div className="py-2">
                    <p className="text-xs text-muted-foreground">Starting from</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(startingPrice)}</p>
                  </div>
                  <Button 
                    onClick={() => setIsBookingMode(true)}
                    className="w-full gap-2 shadow-glow-rose"
                    size="lg"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    Book Appointment
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Floating Book Now Bar - Only in browse mode */}
      <AnimatePresence>
        {!isBookingMode && (
          <BookNowBar 
            startingPrice={startingPrice} 
            onBookClick={() => setIsBookingMode(true)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile: Full-screen Booking Sheet */}
      <Sheet open={isBookingMode} onOpenChange={setIsBookingMode}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-4 sm:p-6 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Book Appointment</SheetTitle>
          </SheetHeader>
          <BookingPanel
            currentStep={currentStep}
            services={services}
            staff={staff}
            selectedService={selectedService}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedPaymentMethod={selectedPaymentMethod}
            timeSlots={timeSlots}
            salonId={salon.id}
            user={user}
            isBooking={isBooking}
            onServiceSelect={handleServiceSelect}
            onStaffSelect={handleStaffSelect}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            onPaymentMethodChange={setSelectedPaymentMethod}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onConfirm={handleConfirmBooking}
            canProceed={canProceed}
            onClose={handleCloseBooking}
          />
        </SheetContent>
      </Sheet>

      {/* Route Drawer - Uber/PickMe Style Full-Screen Route View */}
      <Drawer open={showRouteDrawer} onOpenChange={setShowRouteDrawer}>
        <DrawerContent className="h-[95vh] p-0">
          <RouteView
            salon={{ ...salon, distance: salonDistance }}
            userLocation={{ lat: latitude!, lng: longitude! }}
            routeInfo={routeInfo}
            isRouteLoading={routeLoading}
            onClose={() => setShowRouteDrawer(false)}
            onStartNavigation={() => {
              handleNavigateToSalon();
              setShowRouteDrawer(false);
            }}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SalonDetail;
