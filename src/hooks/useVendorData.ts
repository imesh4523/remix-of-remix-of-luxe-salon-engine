import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import type { BookingStatus } from '@/types';
import { generateSlug, generateUniqueSlug } from '@/lib/slug';

export interface StaffShift {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  staff?: { name: string; avatar_url: string | null };
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface ServicePopularity {
  name: string;
  count: number;
  revenue: number;
}

// Fetch staff shifts
export const useStaffShifts = (salonId?: string, date?: Date) => {
  return useQuery({
    queryKey: ['staff_shifts', salonId, date?.toISOString()],
    queryFn: async () => {
      if (!salonId) return [];

      // Get all staff for this salon first
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, name, avatar_url')
        .eq('salon_id', salonId)
        .eq('is_active', true);

      if (staffError) throw staffError;

      let query = supabase
        .from('staff_shifts')
        .select('*')
        .in('staff_id', staff.map(s => s.id))
        .order('date', { ascending: true });

      if (date) {
        query = query.eq('date', format(date, 'yyyy-MM-dd'));
      }

      const { data: shifts, error } = await query;
      if (error) throw error;

      return shifts.map(shift => ({
        ...shift,
        staff: staff.find(s => s.id === shift.staff_id),
      })) as StaffShift[];
    },
    enabled: !!salonId,
  });
};

// Create staff shift
export const useCreateStaffShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift: {
      staff_id: string;
      date: string;
      start_time: string;
      end_time: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert(shift)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_shifts'] });
      toast.success('Shift created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shift');
    },
  });
};

// Update staff shift
export const useUpdateStaffShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<StaffShift>;
    }) => {
      const { error } = await supabase
        .from('staff_shifts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_shifts'] });
      toast.success('Shift updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shift');
    },
  });
};

// Delete staff shift
export const useDeleteStaffShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_shifts'] });
      toast.success('Shift deleted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete shift');
    },
  });
};

// Analytics: Revenue by date
export const useRevenueAnalytics = (salonId?: string, months = 3) => {
  return useQuery({
    queryKey: ['revenue_analytics', salonId, months],
    queryFn: async () => {
      if (!salonId) return [];

      const startDate = format(subMonths(new Date(), months), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, total_amount, vendor_payout, status')
        .eq('salon_id', salonId)
        .eq('status', 'completed')
        .gte('booking_date', startDate)
        .order('booking_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped = data.reduce((acc, booking) => {
        const date = booking.booking_date;
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, bookings: 0 };
        }
        acc[date].revenue += Number(booking.vendor_payout);
        acc[date].bookings += 1;
        return acc;
      }, {} as Record<string, RevenueData>);

      return Object.values(grouped);
    },
    enabled: !!salonId,
  });
};

// Analytics: Service popularity
export const useServicePopularity = (salonId?: string) => {
  return useQuery({
    queryKey: ['service_popularity', salonId],
    queryFn: async () => {
      if (!salonId) return [];

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('service_id, total_amount')
        .eq('salon_id', salonId)
        .eq('status', 'completed');

      if (bookingsError) throw bookingsError;

      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .eq('salon_id', salonId);

      if (servicesError) throw servicesError;

      // Count by service
      const counts = bookings.reduce((acc, booking) => {
        const serviceId = booking.service_id;
        if (!acc[serviceId]) {
          acc[serviceId] = { count: 0, revenue: 0 };
        }
        acc[serviceId].count += 1;
        acc[serviceId].revenue += Number(booking.total_amount);
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      return services
        .map(service => ({
          name: service.name,
          count: counts[service.id]?.count || 0,
          revenue: counts[service.id]?.revenue || 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!salonId,
  });
};

// Analytics: Customer demographics
export const useCustomerDemographics = (salonId?: string) => {
  return useQuery({
    queryKey: ['customer_demographics', salonId],
    queryFn: async () => {
      if (!salonId) return { totalCustomers: 0, repeatCustomers: 0, avgBookingsPerCustomer: 0 };

      const { data, error } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('salon_id', salonId);

      if (error) throw error;

      const customerCounts = data.reduce((acc, booking) => {
        acc[booking.customer_id] = (acc[booking.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalCustomers = Object.keys(customerCounts).length;
      const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length;
      const avgBookingsPerCustomer = totalCustomers > 0 
        ? data.length / totalCustomers 
        : 0;

      return {
        totalCustomers,
        repeatCustomers,
        avgBookingsPerCustomer: Math.round(avgBookingsPerCustomer * 10) / 10,
      };
    },
    enabled: !!salonId,
  });
};

// Monthly summary
export const useMonthlySummary = (salonId?: string) => {
  return useQuery({
    queryKey: ['monthly_summary', salonId],
    queryFn: async () => {
      if (!salonId) return null;

      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      const [thisMonth, lastMonth] = await Promise.all([
        supabase
          .from('bookings')
          .select('total_amount, vendor_payout, status')
          .eq('salon_id', salonId)
          .gte('booking_date', thisMonthStart)
          .lte('booking_date', thisMonthEnd),
        supabase
          .from('bookings')
          .select('total_amount, vendor_payout, status')
          .eq('salon_id', salonId)
          .gte('booking_date', lastMonthStart)
          .lte('booking_date', lastMonthEnd),
      ]);

      const thisMonthCompleted = thisMonth.data?.filter(b => b.status === 'completed') || [];
      const lastMonthCompleted = lastMonth.data?.filter(b => b.status === 'completed') || [];

      const thisMonthRevenue = thisMonthCompleted.reduce((sum, b) => sum + Number(b.vendor_payout), 0);
      const lastMonthRevenue = lastMonthCompleted.reduce((sum, b) => sum + Number(b.vendor_payout), 0);

      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      return {
        thisMonthRevenue,
        lastMonthRevenue,
        revenueChange: Math.round(revenueChange),
        thisMonthBookings: thisMonth.data?.length || 0,
        lastMonthBookings: lastMonth.data?.length || 0,
        thisMonthCompleted: thisMonthCompleted.length,
      };
    },
    enabled: !!salonId,
  });
};

// Request payout
export const useRequestPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salonId,
      walletId,
      amount,
      bankDetails,
    }: {
      salonId: string;
      walletId: string;
      amount: number;
      bankDetails: Json;
    }) => {
      const { error } = await supabase.from('payout_requests').insert([{
        salon_id: salonId,
        wallet_id: walletId,
        amount,
        bank_details: bankDetails,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout_requests'] });
      toast.success('Payout request submitted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit payout request');
    },
  });
};

// Update salon visibility
export const useUpdateSalonVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salonId,
      status,
    }: {
      salonId: string;
      status: 'approved' | 'suspended';
    }) => {
      const { error } = await supabase
        .from('salons')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', salonId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['my_salon'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(`Store is now ${status === 'approved' ? 'Online' : 'Offline'}!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update visibility');
    },
  });
};

// Create staff member
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: {
      salon_id: string;
      name: string;
      title?: string;
      bio?: string;
      avatar_url?: string;
    }) => {
      const { data, error } = await supabase.from('staff').insert(staff).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add staff');
    },
  });
};

// Update staff member
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{ name: string; title: string; bio: string; avatar_url: string; is_active: boolean }>;
    }) => {
      const { error } = await supabase
        .from('staff')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update staff');
    },
  });
};

// Create service
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      salon_id: string;
      name: string;
      description?: string;
      price: number;
      duration_minutes: number;
      category_id?: string;
    }) => {
      const { data, error } = await supabase.from('services').insert(service).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create service');
    },
  });
};

// Update service
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        name: string;
        description: string;
        price: number;
        duration_minutes: number;
        is_active: boolean;
        category_id: string;
      }>;
    }) => {
      const { error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
};

// Create new salon with auto-generated slug
export const useCreateSalon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salon: {
      owner_id: string;
      name: string;
      description?: string;
      address: string;
      city: string;
      phone?: string;
      email?: string;
      latitude?: number;
      longitude?: number;
      province_id?: string;
      district_id?: string;
      town_id?: string;
    }) => {
      // Generate unique slug from salon name
      const slug = await generateUniqueSlug(salon.name);
      
      const { data, error } = await supabase
        .from('salons')
        .insert({
          ...salon,
          slug,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_salon'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success('Salon created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create salon');
    },
  });
};

// Update salon details (with slug regeneration on name change)
export const useUpdateSalon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salonId,
      updates,
    }: {
      salonId: string;
      updates: Partial<{
        name: string;
        slug: string;
        description: string | null;
        address: string;
        city: string;
        phone: string | null;
        email: string | null;
        cover_image: string | null;
        logo: string | null;
        latitude: number | null;
        longitude: number | null;
        province_id: string | null;
        district_id: string | null;
        town_id: string | null;
      }>;
    }) => {
      // If name is being updated, regenerate the slug
      let finalUpdates = { ...updates };
      
      if (updates.name) {
        const newSlug = await generateUniqueSlug(updates.name, salonId);
        finalUpdates = { ...finalUpdates, slug: newSlug };
      }
      
      const { error } = await supabase
        .from('salons')
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
        .eq('id', salonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_salon'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success('Salon details updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update salon');
    },
  });
};

// Upload salon image (cover or logo)
export const useUploadSalonImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salonId,
      file,
      type,
    }: {
      salonId: string;
      file: File;
      type: 'cover' | 'logo';
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${salonId}/${type}-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(fileName);

      // Update salon record
      const updateField = type === 'cover' ? 'cover_image' : 'logo';
      const { error: updateError } = await supabase
        .from('salons')
        .update({ 
          [updateField]: publicUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', salonId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_salon'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

// Salon completion rate
export const useSalonCompletionRate = (salonId?: string) => {
  return useQuery({
    queryKey: ['salon_completion_rate', salonId],
    queryFn: async () => {
      if (!salonId) return { completed: 0, total: 0, rate: 0, previousRate: undefined };

      // Get current month data
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      // Current month stats
      const { data: currentData } = await supabase
        .from('bookings')
        .select('status')
        .eq('salon_id', salonId)
        .gte('booking_date', thisMonthStart);

      // Last month stats for comparison
      const { data: lastMonthData } = await supabase
        .from('bookings')
        .select('status')
        .eq('salon_id', salonId)
        .gte('booking_date', lastMonthStart)
        .lte('booking_date', lastMonthEnd);

      // Calculate current rate
      const completed = currentData?.filter((b) => b.status === 'completed').length || 0;
      const relevantStatuses: BookingStatus[] = ['completed', 'cancelled', 'confirmed', 'in_progress'];
      const total = currentData?.filter((b) => relevantStatuses.includes(b.status as BookingStatus)).length || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate previous month rate
      const lastCompleted = lastMonthData?.filter((b) => b.status === 'completed').length || 0;
      const lastTotal = lastMonthData?.filter((b) => relevantStatuses.includes(b.status as BookingStatus)).length || 0;
      const previousRate = lastTotal > 0 ? Math.round((lastCompleted / lastTotal) * 100) : undefined;

      return { completed, total, rate, previousRate };
    },
    enabled: !!salonId,
  });
};
