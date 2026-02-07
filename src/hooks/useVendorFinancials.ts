import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to fetch salon's platform payable amount with credit limit info
 * This tracks commission owed to platform from cash bookings
 */
export const useSalonPlatformPayable = (salonId?: string) => {
  return useQuery({
    queryKey: ['salon_platform_payable', salonId],
    queryFn: async () => {
      if (!salonId) return null;

      const { data, error } = await supabase
        .from('salons')
        .select('platform_payable, commission_rate, credit_limit, credit_limit_orders, trust_level, orders_since_settlement, auto_frozen_at, auto_freeze_reason, status')
        .eq('id', salonId)
        .single();

      if (error) throw error;
      
      const platformPayable = Number(data.platform_payable) || 0;
      const creditLimit = Number(data.credit_limit) || 10000;
      const usagePercent = Math.min(100, (platformPayable / creditLimit) * 100);
      
      return {
        platformPayable,
        commissionRate: data.commission_rate || 7,
        creditLimit,
        creditLimitOrders: data.credit_limit_orders,
        trustLevel: data.trust_level || 'new',
        ordersSinceSettlement: data.orders_since_settlement || 0,
        autoFrozenAt: data.auto_frozen_at,
        autoFreezeReason: data.auto_freeze_reason,
        isFrozen: !!data.auto_frozen_at,
        status: data.status,
        usagePercent,
      };
    },
    enabled: !!salonId,
  });
};

/**
 * Hook to fetch commission settlements for a salon
 */
export const useCommissionSettlements = (salonId?: string) => {
  return useQuery({
    queryKey: ['commission_settlements', salonId],
    queryFn: async () => {
      if (!salonId) return [];

      const { data, error } = await supabase
        .from('commission_settlements')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!salonId,
  });
};

/**
 * Hook to get vendor's wallet with platform payable context
 */
export const useVendorWallet = (userId?: string, salonId?: string) => {
  return useQuery({
    queryKey: ['vendor_wallet', userId, salonId],
    queryFn: async () => {
      if (!userId) return null;

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError) throw walletError;

      // Get platform payable from salon
      let platformPayable = 0;
      if (salonId) {
        const { data: salon } = await supabase
          .from('salons')
          .select('platform_payable')
          .eq('id', salonId)
          .single();
        
        platformPayable = Number(salon?.platform_payable) || 0;
      }

      return {
        wallet: wallet || { balance: 0, is_frozen: false },
        platformPayable,
        availableForPayout: Math.max(0, (wallet?.balance || 0) - platformPayable),
      };
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get cash vs online payment breakdown for a salon
 */
export const usePaymentMethodBreakdown = (salonId?: string) => {
  return useQuery({
    queryKey: ['payment_method_breakdown', salonId],
    queryFn: async () => {
      if (!salonId) return { cash: 0, online: 0, crypto: 0 };

      const { data, error } = await supabase
        .from('bookings')
        .select('payment_method, total_amount, platform_commission')
        .eq('salon_id', salonId)
        .eq('status', 'completed');

      if (error) throw error;

      const breakdown = data.reduce(
        (acc, booking) => {
          const method = booking.payment_method as 'cash' | 'online' | 'crypto';
          acc[method] = (acc[method] || 0) + Number(booking.total_amount);
          acc[`${method}_commission`] = (acc[`${method}_commission`] || 0) + Number(booking.platform_commission);
          return acc;
        },
        { cash: 0, online: 0, crypto: 0, cash_commission: 0, online_commission: 0, crypto_commission: 0 } as Record<string, number>
      );

      return breakdown;
    },
    enabled: !!salonId,
  });
};

/**
 * Hook for vendor to settle platform payable (record intention to pay)
 */
export const useSettleCommission = () => {
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
      // Create settlement record
      const { error: settlementError } = await supabase
        .from('commission_settlements')
        .insert({
          salon_id: salonId,
          amount,
          type: 'manual_settlement',
          payment_method: 'bank_transfer',
          notes: notes || 'Vendor initiated settlement',
        });

      if (settlementError) throw settlementError;

      // Note: The actual platform_payable reduction would be done by admin
      // after verifying the payment was received

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon_platform_payable'] });
      queryClient.invalidateQueries({ queryKey: ['commission_settlements'] });
      toast.success('Settlement request recorded. Admin will verify payment.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record settlement');
    },
  });
};
