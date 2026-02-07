import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to fetch all salons with their platform payable amounts
 */
export const usePlatformReceivables = () => {
  return useQuery({
    queryKey: ['platform_receivables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('id, name, city, platform_payable, commission_rate, status, credit_limit, trust_level, auto_frozen_at, auto_freeze_reason, orders_since_settlement')
        .or('status.eq.approved,auto_frozen_at.not.is.null')
        .order('platform_payable', { ascending: false });

      if (error) throw error;
      return data.map((salon) => {
        const platformPayable = Number(salon.platform_payable) || 0;
        const creditLimit = Number(salon.credit_limit) || 10000;
        return {
          ...salon,
          platform_payable: platformPayable,
          credit_limit: creditLimit,
          usage_percent: Math.min(100, (platformPayable / creditLimit) * 100),
          is_frozen: !!salon.auto_frozen_at,
        };
      });
    },
  });
};

/**
 * Hook to get total platform receivables summary
 */
export const usePlatformReceivablesSummary = () => {
  return useQuery({
    queryKey: ['platform_receivables_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('platform_payable')
        .eq('status', 'approved');

      if (error) throw error;

      const total = data.reduce((sum, s) => sum + (Number(s.platform_payable) || 0), 0);
      const salonsWithDebt = data.filter((s) => Number(s.platform_payable) > 0).length;

      return { total, salonsWithDebt };
    },
  });
};

/**
 * Hook to fetch commission settlements with filters
 */
export const useAllCommissionSettlements = (type?: string) => {
  return useQuery({
    queryKey: ['all_commission_settlements', type],
    queryFn: async () => {
      let query = supabase
        .from('commission_settlements')
        .select(`
          *,
          salons(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Hook to collect commission from a salon (reduce platform_payable)
 * Also handles auto-unfreeze if salon was frozen and now below limit
 */
export const useCollectCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salonId,
      amount,
      notes,
    }: {
      salonId: string;
      amount: number;
      notes?: string;
    }) => {
      // Get current salon state including credit limit and freeze status
      const { data: salon, error: fetchError } = await supabase
        .from('salons')
        .select('platform_payable, credit_limit, status, auto_frozen_at, auto_freeze_reason, orders_since_settlement')
        .eq('id', salonId)
        .single();

      if (fetchError) throw fetchError;

      const currentPayable = Number(salon.platform_payable) || 0;
      const newPayable = Math.max(0, currentPayable - amount);
      const creditLimit = Number(salon.credit_limit) || 10000;

      // Prepare update data
      const updateData: Record<string, any> = {
        platform_payable: newPayable,
        orders_since_settlement: 0, // Reset order counter on settlement
      };

      // Auto-unfreeze if it was auto-frozen and now below limit
      if (salon.status === 'suspended' && salon.auto_frozen_at && newPayable < creditLimit) {
        updateData.status = 'approved';
        updateData.auto_frozen_at = null;
        updateData.auto_freeze_reason = null;
      }

      // Update salon
      const { error: updateError } = await supabase
        .from('salons')
        .update(updateData)
        .eq('id', salonId);

      if (updateError) throw updateError;

      // Create settlement record
      const { error: settlementError } = await supabase
        .from('commission_settlements')
        .insert({
          salon_id: salonId,
          amount,
          type: 'commission_paid',
          payment_method: 'manual_settlement',
          notes: notes || 'Admin collected commission',
        });

      if (settlementError) throw settlementError;

      // Log activity if salon was unfrozen
      if (updateData.status === 'approved') {
        await supabase
          .from('activity_logs')
          .insert({
            entity_type: 'salon',
            entity_id: salonId,
            action: 'auto_unfreeze',
            details: {
              previous_payable: currentPayable,
              new_payable: newPayable,
              amount_collected: amount,
            },
          });
      }

      return { success: true, newPayable, wasUnfrozen: updateData.status === 'approved' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform_receivables'] });
      queryClient.invalidateQueries({ queryKey: ['platform_receivables_summary'] });
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      queryClient.invalidateQueries({ queryKey: ['all_commission_settlements'] });
      queryClient.invalidateQueries({ queryKey: ['salons_near_limit'] });
      
      if (data.wasUnfrozen) {
        toast.success('Commission collected! Salon has been automatically unfrozen.');
      } else {
        toast.success('Commission collected successfully!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to collect commission');
    },
  });
};

/**
 * Hook to get financial overview for admin dashboard
 */
export const useFinancialOverview = () => {
  return useQuery({
    queryKey: ['financial_overview'],
    queryFn: async () => {
      // Get all completed bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_amount, platform_commission, vendor_payout, payment_method, commission_settled')
        .eq('status', 'completed');

      if (bookingsError) throw bookingsError;

      // Get platform receivables
      const { data: salons, error: salonsError } = await supabase
        .from('salons')
        .select('platform_payable')
        .eq('status', 'approved');

      if (salonsError) throw salonsError;

      // Calculate totals
      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const totalCommissionEarned = bookings.reduce((sum, b) => sum + Number(b.platform_commission), 0);
      const totalVendorPayouts = bookings.reduce((sum, b) => sum + Number(b.vendor_payout), 0);
      const totalReceivables = salons.reduce((sum, s) => sum + (Number(s.platform_payable) || 0), 0);

      // Cash vs Online breakdown
      const cashBookings = bookings.filter((b) => b.payment_method === 'cash');
      const onlineBookings = bookings.filter((b) => b.payment_method !== 'cash');

      const cashCommission = cashBookings.reduce((sum, b) => sum + Number(b.platform_commission), 0);
      const onlineCommission = onlineBookings.reduce((sum, b) => sum + Number(b.platform_commission), 0);

      const collectedCommission = onlineCommission; // Online is auto-collected
      const pendingCommission = totalReceivables; // From cash

      return {
        totalRevenue,
        totalCommissionEarned,
        totalVendorPayouts,
        totalReceivables,
        collectedCommission,
        pendingCommission,
        cashBookingsCount: cashBookings.length,
        onlineBookingsCount: onlineBookings.length,
      };
    },
  });
};
