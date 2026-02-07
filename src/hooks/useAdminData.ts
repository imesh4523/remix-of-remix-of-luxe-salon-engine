import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'refund' | 'commission' | 'payout' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  assigned_admin_id: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_booking_id: string | null;
  related_salon_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles?: { full_name: string | null; avatar_url: string | null };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

export interface PayoutRequest {
  id: string;
  salon_id: string;
  wallet_id: string;
  amount: number;
  status: string;
  bank_details: Record<string, unknown> | null;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  salons?: { name: string; owner_id: string };
}

// Fetch all users with profiles and roles
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      return profiles.map(profile => {
        const typedProfile = profile as typeof profile & { 
          is_suspended?: boolean; 
          suspended_at?: string | null;
          suspended_reason?: string | null;
          registration_ip?: string | null;
          last_login_ip?: string | null;
          last_login_at?: string | null;
        };
        return {
          ...typedProfile,
          roles: roles.filter(r => r.user_id === typedProfile.user_id).map(r => r.role),
          wallet: wallets.find(w => w.user_id === typedProfile.user_id),
        };
      });
    },
  });
};

// Fetch user wallet
export const useUserWallet = (userId?: string) => {
  return useQuery({
    queryKey: ['user_wallet', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!userId,
  });
};

// Fetch wallet transactions
export const useWalletTransactions = (walletId?: string) => {
  return useQuery({
    queryKey: ['wallet_transactions', walletId],
    queryFn: async () => {
      if (!walletId) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!walletId,
  });
};

// Create/update wallet and add transaction
export const useWalletAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      type,
      description,
    }: {
      userId: string;
      amount: number;
      type: 'credit' | 'debit' | 'refund' | 'adjustment';
      description: string;
    }) => {
      // First get or create wallet
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError) throw walletError;

      const currentBalance = wallet?.balance || 0;
      const newBalance = type === 'debit' ? currentBalance - amount : currentBalance + amount;

      if (!wallet) {
        // Create wallet
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: newBalance, currency: 'LKR' })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else {
        // Update wallet balance
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id);

        if (updateError) throw updateError;
      }

      // Create transaction record
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type,
        amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description,
      });

      if (txError) throw txError;

      return { wallet, newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
      queryClient.invalidateQueries({ queryKey: ['user_wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet_transactions'] });
      toast.success('Wallet adjusted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust wallet');
    },
  });
};

// Freeze/unfreeze wallet
export const useToggleWalletFreeze = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ walletId, freeze }: { walletId: string; freeze: boolean }) => {
      const { error } = await supabase
        .from('wallets')
        .update({ is_frozen: freeze, updated_at: new Date().toISOString() })
        .eq('id', walletId);

      if (error) throw error;
    },
    onSuccess: (_, { freeze }) => {
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
      queryClient.invalidateQueries({ queryKey: ['user_wallet'] });
      toast.success(`Wallet ${freeze ? 'frozen' : 'unfrozen'} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update wallet');
    },
  });
};

// Fetch support tickets
export const useSupportTickets = (status?: string) => {
  return useQuery({
    queryKey: ['support_tickets', status],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as 'open' | 'in_progress' | 'resolved' | 'closed');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
};

// Fetch ticket messages
export const useTicketMessages = (ticketId?: string) => {
  return useQuery({
    queryKey: ['ticket_messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!ticketId,
  });
};

// Send ticket message
export const useSendTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      senderId,
      message,
      isAdmin,
    }: {
      ticketId: string;
      senderId: string;
      message: string;
      isAdmin: boolean;
    }) => {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_id: senderId,
        message,
        is_admin: isAdmin,
      });

      if (error) throw error;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket_messages', ticketId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
};

// Update ticket status
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      assignedAdminId,
    }: {
      ticketId: string;
      status: 'open' | 'in_progress' | 'resolved' | 'closed';
      assignedAdminId?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (assignedAdminId) {
        updates.assigned_admin_id = assignedAdminId;
      }

      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
      toast.success('Ticket updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update ticket');
    },
  });
};

// Fetch activity logs
export const useActivityLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['activity_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
  });
};

// Log activity
export const useLogActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      action,
      entityType,
      entityId,
      details,
    }: {
      userId?: string;
      action: string;
      entityType: string;
      entityId?: string;
      details?: Json;
    }) => {
      const insertData: {
        action: string;
        entity_type: string;
        user_id?: string;
        entity_id?: string;
        details?: Json;
      } = {
        action,
        entity_type: entityType,
      };
      
      if (userId) insertData.user_id = userId;
      if (entityId) insertData.entity_id = entityId;
      if (details) insertData.details = details;

      const { error } = await supabase.from('activity_logs').insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });
};

// Fetch payout requests
export const usePayoutRequests = (status?: string) => {
  return useQuery({
    queryKey: ['payout_requests', status],
    queryFn: async () => {
      let query = supabase
        .from('payout_requests')
        .select('*, salons(name, owner_id)')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayoutRequest[];
    },
  });
};

// Process payout request
export const useProcessPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payoutId,
      status,
      processedBy,
      notes,
    }: {
      payoutId: string;
      status: 'approved' | 'rejected';
      processedBy: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status,
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', payoutId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['payout_requests'] });
      toast.success(`Payout ${status} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });
};

// Update salon commission rate
export const useUpdateSalonCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ salonId, rate }: { salonId: string; rate: number }) => {
      const { error } = await supabase
        .from('salons')
        .update({ commission_rate: rate, updated_at: new Date().toISOString() })
        .eq('id', salonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success('Commission rate updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update commission');
    },
  });
};

// Search users and salons
export const useGlobalSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['global_search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { users: [], salons: [] };

      const [usersResult, salonsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          .limit(10),
        supabase
          .from('salons')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(10),
      ]);

      return {
        users: usersResult.data || [],
        salons: salonsResult.data || [],
      };
    },
    enabled: searchTerm.length >= 2,
  });
};

// Realtime subscription for tickets
export const useRealtimeTickets = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime_tickets_subscription'],
    queryFn: () => {
      const channel = supabase
        .channel('tickets-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_tickets' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ticket_messages' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['ticket_messages'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    staleTime: Infinity,
  });
};

// Realtime subscription for activity logs
export const useRealtimeActivityLogs = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime_activity_subscription'],
    queryFn: () => {
      const channel = supabase
        .channel('activity-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_logs' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    staleTime: Infinity,
  });
};

// Fetch all transactions (bookings with payment info)
export interface TransactionData {
  id: string;
  booking_date: string;
  start_time: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  platform_commission: number;
  vendor_payout: number;
  status: string;
  salon_id: string;
  service_id: string;
  customer_id: string;
  salons?: { name: string; owner_id: string };
  services?: { name: string };
}

export const useAllTransactions = (filters?: {
  salonId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
}) => {
  return useQuery({
    queryKey: ['all_transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          total_amount,
          payment_method,
          payment_status,
          platform_commission,
          vendor_payout,
          status,
          salon_id,
          service_id,
          customer_id,
          salons(name, owner_id),
          services(name)
        `)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.salonId) {
        query = query.eq('salon_id', filters.salonId);
      }
      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters?.dateFrom) {
        query = query.gte('booking_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('booking_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TransactionData[];
    },
  });
};

// Get salon financial summary
export const useSalonFinancials = (salonId: string) => {
  return useQuery({
    queryKey: ['salon_financials', salonId],
    queryFn: async () => {
      if (!salonId) return null;

      const [bookingsResult, payoutsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('total_amount, vendor_payout, platform_commission, status, payment_status')
          .eq('salon_id', salonId),
        supabase
          .from('payout_requests')
          .select('amount, status')
          .eq('salon_id', salonId),
      ]);

      const bookings = bookingsResult.data || [];
      const payouts = payoutsResult.data || [];

      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum, b) => sum + Number(b.vendor_payout), 0);
      const totalCommission = completedBookings.reduce((sum, b) => sum + Number(b.platform_commission), 0);
      const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
      const completedPayouts = payouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        totalEarnings,
        totalCommission,
        pendingPayouts,
        completedPayouts,
        availableBalance: totalEarnings - completedPayouts - pendingPayouts,
        bookingsCount: bookings.length,
        completedCount: completedBookings.length,
      };
    },
    enabled: !!salonId,
  });
};

// ============= BOOKING MANAGEMENT HOOKS =============

export interface BookingWithDetails {
  id: string;
  customer_id: string;
  salon_id: string;
  staff_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  platform_commission: number;
  vendor_payout: number;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  salon?: { name: string; logo: string | null };
  staff?: { name: string };
  service?: { name: string };
  customer?: { full_name: string | null; avatar_url: string | null };
}

export const useAllBookings = () => {
  return useQuery({
    queryKey: ['all_bookings'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          salons(name, logo),
          staff(name),
          services(name)
        `)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles separately
      const customerIds = [...new Set(bookings.map(b => b.customer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', customerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return bookings.map(booking => ({
        ...booking,
        salon: booking.salons,
        staff: booking.staff,
        service: booking.services,
        customer: profileMap.get(booking.customer_id) || null,
      })) as BookingWithDetails[];
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelled by admin: ${reason}` : 'Cancelled by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
};

export const useRefundBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, amount }: { bookingId: string; amount: number }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          notes: `Refunded Rs. ${amount} by admin`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_bookings'] });
      toast.success('Booking refunded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to refund booking');
    },
  });
};

// ============= SERVICE CATEGORY HOOKS =============

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon?: string }) => {
      // Get max display_order
      const { data: existing } = await supabase
        .from('service_categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const maxOrder = existing?.[0]?.display_order || 0;

      const { data, error } = await supabase
        .from('service_categories')
        .insert({
          name,
          icon: icon || null,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      icon,
      display_order,
      is_active,
    }: {
      id: string;
      name?: string;
      icon?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (icon !== undefined) updates.icon = icon;
      if (display_order !== undefined) updates.display_order = display_order;
      if (is_active !== undefined) updates.is_active = is_active;

      const { error } = await supabase
        .from('service_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // First, unassign services from this category
      await supabase
        .from('services')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
};

// ============= REVIEW MODERATION HOOKS =============

export interface ReviewWithDetails {
  id: string;
  booking_id: string;
  customer_id: string;
  salon_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_by: string | null;
  admin_response: string | null;
  salon?: { name: string };
  customer?: { full_name: string | null; avatar_url: string | null };
}

export const useAllReviews = () => {
  return useQuery({
    queryKey: ['all_reviews'],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          salons(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles
      const customerIds = [...new Set(reviews.map(r => r.customer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', customerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return reviews.map(review => ({
        ...review,
        salon: review.salons,
        customer: profileMap.get(review.customer_id) || null,
      })) as ReviewWithDetails[];
    },
  });
};

export const useHideReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      isHidden,
      reason,
    }: {
      reviewId: string;
      isHidden: boolean;
      reason?: string;
    }) => {
      const updates: Record<string, unknown> = {
        is_hidden: isHidden,
      };

      if (isHidden && reason) {
        updates.hidden_reason = reason;
      } else if (!isHidden) {
        updates.hidden_reason = null;
        updates.hidden_by = null;
      }

      const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: (_, { isHidden }) => {
      queryClient.invalidateQueries({ queryKey: ['all_reviews'] });
      toast.success(isHidden ? 'Review hidden' : 'Review is now visible');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update review');
    },
  });
};

export const useRespondToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      response,
    }: {
      reviewId: string;
      response: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_response: response })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_reviews'] });
      toast.success('Response saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save response');
    },
  });
};
