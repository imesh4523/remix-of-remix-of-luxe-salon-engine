import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CryptoPaymentStatus = 
  | 'waiting' 
  | 'confirming' 
  | 'confirmed' 
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed' 
  | 'refunded'
  | 'expired';

export interface CryptoPaymentInfo {
  payment_id: string;
  invoice_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  status: CryptoPaymentStatus;
  actually_paid?: number;
  expires_at: string;
  paid_at?: string;
}

export interface CreateInvoiceParams {
  price_amount: number;
  price_currency?: string;
  pay_currency: string;
  order_id: string;
  order_description?: string;
}

export const useCryptoPayment = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<CryptoPaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCallback(async (params: CreateInvoiceParams) => {
    setIsCreating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to continue');
      }

      const response = await supabase.functions.invoke('create-crypto-invoice', {
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to create invoice');
      }

      const info: CryptoPaymentInfo = {
        payment_id: response.data.payment_id,
        invoice_id: response.data.invoice_id,
        pay_address: response.data.pay_address,
        pay_amount: response.data.pay_amount,
        pay_currency: response.data.pay_currency,
        price_amount: response.data.price_amount,
        price_currency: response.data.price_currency,
        status: 'waiting',
        expires_at: response.data.expires_at,
      };

      setPaymentInfo(info);
      return info;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const checkStatus = useCallback(async (paymentId: string) => {
    try {
      const response = await supabase.functions.invoke('check-crypto-payment', {
        body: { payment_id: paymentId },
      });

      if (response.error) {
        console.error('Status check error:', response.error);
        return null;
      }

      if (response.data?.success) {
        return {
          status: response.data.status as CryptoPaymentStatus,
          actually_paid: response.data.actually_paid,
          paid_at: response.data.paid_at,
        };
      }

      return null;
    } catch (err) {
      console.error('Failed to check payment status:', err);
      return null;
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (!paymentInfo || !isPolling) return;

    // Don't poll for terminal states
    if (['confirmed', 'finished', 'failed', 'expired', 'refunded'].includes(paymentInfo.status)) {
      setIsPolling(false);
      return;
    }

    const pollInterval = setInterval(async () => {
      const result = await checkStatus(paymentInfo.payment_id);
      
      if (result) {
        setPaymentInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.status,
            actually_paid: result.actually_paid,
            paid_at: result.paid_at,
          };
        });

        // Stop polling if terminal state reached
        if (['confirmed', 'finished', 'failed', 'expired', 'refunded'].includes(result.status)) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [paymentInfo, isPolling, checkStatus]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    setPaymentInfo(null);
    setIsPolling(false);
    setError(null);
  }, []);

  const isConfirmed = paymentInfo?.status === 'confirmed' || paymentInfo?.status === 'finished';
  const isFailed = paymentInfo?.status === 'failed';
  const isExpired = paymentInfo?.status === 'expired';
  const isPending = paymentInfo?.status === 'waiting' || paymentInfo?.status === 'confirming';

  return {
    createInvoice,
    checkStatus,
    startPolling,
    stopPolling,
    reset,
    paymentInfo,
    isCreating,
    isPolling,
    isConfirmed,
    isFailed,
    isExpired,
    isPending,
    error,
  };
};

export default useCryptoPayment;
