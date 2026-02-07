import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SalonStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

// UUID validation helper - skip DB query for invalid UUIDs (mock data IDs)
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Fetch all salons (for explore/home)
export const useSalons = (status?: SalonStatus) => {
  return useQuery({
    queryKey: ['salons', status],
    queryFn: async () => {
      let query = supabase
        .from('salons')
        .select('*')
        .order('rating', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Fetch single salon by ID - skip query for invalid UUIDs
export const useSalon = (id: string) => {
  return useQuery({
    queryKey: ['salon', id],
    queryFn: async () => {
      // Skip DB query for mock data IDs (non-UUID format)
      if (!isValidUUID(id)) {
        return null; // Will fallback to mock data in component
      }
      
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Fetch single salon by slug
export const useSalonBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['salon', 'slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

// Fetch services for a salon - skip query for invalid UUIDs
export const useServices = (salonId?: string) => {
  return useQuery({
    queryKey: ['services', salonId],
    queryFn: async () => {
      // Skip DB query for mock data IDs (non-UUID format)
      if (salonId && !isValidUUID(salonId)) {
        return []; // Will fallback to mock data in component
      }
      
      let query = supabase
        .from('services')
        .select('*, service_categories(name, icon)')
        .eq('is_active', true);

      if (salonId) {
        query = query.eq('salon_id', salonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Fetch staff for a salon - skip query for invalid UUIDs
export const useStaff = (salonId?: string) => {
  return useQuery({
    queryKey: ['staff', salonId],
    queryFn: async () => {
      // Skip DB query for mock data IDs (non-UUID format)
      if (salonId && !isValidUUID(salonId)) {
        return []; // Will fallback to mock data in component
      }
      
      let query = supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (salonId) {
        query = query.eq('salon_id', salonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Fetch staff availability
export const useStaffAvailability = (staffId: string) => {
  return useQuery({
    queryKey: ['staff_availability', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('is_available', true);

      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });
};

// Fetch reviews for a salon - skip query for invalid UUIDs
export const useReviews = (salonId: string) => {
  return useQuery({
    queryKey: ['reviews', salonId],
    queryFn: async () => {
      // Skip DB query for mock data IDs (non-UUID format)
      if (!isValidUUID(salonId)) {
        return []; // Will fallback to mock data in component
      }
      
      // Note: reviews table doesn't have direct FK to profiles, fetch reviews only
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!salonId,
  });
};

// Fetch bookings for customer
export const useMyBookings = (customerId?: string) => {
  return useQuery({
    queryKey: ['my_bookings', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          salons(id, name, logo, address, city),
          services(id, name, price, duration_minutes),
          staff(id, name, avatar_url, title)
        `)
        .eq('customer_id', customerId)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

// Fetch bookings for vendor (salon owner)
export const useSalonBookings = (salonId?: string) => {
  return useQuery({
    queryKey: ['salon_bookings', salonId],
    queryFn: async () => {
      if (!salonId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(id, name, price, duration_minutes),
          staff(id, name, avatar_url, title),
          profiles!bookings_customer_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('salon_id', salonId)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!salonId,
  });
};

// Create booking with conflict check
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: {
      customer_id: string;
      salon_id: string;
      staff_id: string;
      service_id: string;
      booking_date: string;
      start_time: string;
      end_time: string;
      total_amount: number;
      platform_commission: number;
      vendor_payout: number;
      notes?: string;
      payment_method: 'cash' | 'online';
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    }) => {
      // First, check for existing bookings that would conflict
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('staff_id', booking.staff_id)
        .eq('salon_id', booking.salon_id)
        .eq('booking_date', booking.booking_date)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (checkError) throw checkError;

      // Check for time overlap
      if (existingBookings && existingBookings.length > 0) {
        const [newStartHour, newStartMinute] = booking.start_time.split(':').map(Number);
        const [newEndHour, newEndMinute] = booking.end_time.split(':').map(Number);
        const newStart = newStartHour * 60 + newStartMinute;
        const newEnd = newEndHour * 60 + newEndMinute;

        for (const existing of existingBookings) {
          const [existingStartHour, existingStartMinute] = existing.start_time.split(':').map(Number);
          const [existingEndHour, existingEndMinute] = existing.end_time.split(':').map(Number);
          const existingStart = existingStartHour * 60 + existingStartMinute;
          const existingEnd = existingEndHour * 60 + existingEndMinute;

          // Check overlap: new booking starts before existing ends AND new booking ends after existing starts
          if (newStart < existingEnd && newEnd > existingStart) {
            throw new Error('This time slot is already booked. Please choose another time.');
          }
        }
      }

      // If no conflict, create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['salon_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booked_slots'] });
      toast.success('Booking created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });
};

// Update booking status
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['salon_bookings'] });
      toast.success('Booking status updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update booking');
    },
  });
};

// Fetch service categories
export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

// Admin: Update salon status
export const useUpdateSalonStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SalonStatus }) => {
      const { data, error } = await supabase
        .from('salons')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(`Salon ${variables.status} successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update salon status');
    },
  });
};

// Vendor: Get my salon
export const useMySalon = (ownerId?: string) => {
  return useQuery({
    queryKey: ['my_salon', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;

      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

// Admin: Get platform stats
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['platform_stats'],
    queryFn: async () => {
      const [salonsResult, bookingsResult, usersResult] = await Promise.all([
        supabase.from('salons').select('id, status', { count: 'exact' }),
        supabase.from('bookings').select('total_amount, platform_commission, status'),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);

      const approvedSalons = salonsResult.data?.filter(s => s.status === 'approved').length || 0;
      const pendingSalons = salonsResult.data?.filter(s => s.status === 'pending').length || 0;
      
      const completedBookings = bookingsResult.data?.filter(b => b.status === 'completed') || [];
      const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const platformEarnings = completedBookings.reduce((sum, b) => sum + Number(b.platform_commission), 0);

      return {
        totalSalons: salonsResult.count || 0,
        approvedSalons,
        pendingSalons,
        totalUsers: usersResult.count || 0,
        totalRevenue,
        platformEarnings,
        totalBookings: bookingsResult.data?.length || 0,
      };
    },
  });
};
