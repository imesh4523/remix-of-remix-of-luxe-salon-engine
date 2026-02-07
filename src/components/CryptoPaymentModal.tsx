import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, AlertCircle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CryptoCurrencySelector, SUPPORTED_CRYPTOS } from '@/components/CryptoCurrencySelector';
import { useCryptoPayment, CreateInvoiceParams } from '@/hooks/useCryptoPayment';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  currency?: string;
  orderId: string;
  orderDescription?: string;
}

export const CryptoPaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency = 'USD',
  orderId,
  orderDescription,
}: CryptoPaymentModalProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const {
    createInvoice,
    startPolling,
    reset,
    paymentInfo,
    isCreating,
    isPolling,
    isConfirmed,
    isFailed,
    isExpired,
    isPending,
    error,
  } = useCryptoPayment();

  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!paymentInfo?.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(paymentInfo.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentInfo?.expires_at]);

  // Handle success
  useEffect(() => {
    if (isConfirmed && paymentInfo) {
      toast.success('Payment confirmed!');
      onSuccess(paymentInfo.payment_id);
    }
  }, [isConfirmed, paymentInfo, onSuccess]);

  const handleCreateInvoice = async () => {
    if (!selectedCrypto) {
      toast.error('Please select a cryptocurrency');
      return;
    }

    try {
      const params: CreateInvoiceParams = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: selectedCrypto,
        order_id: orderId,
        order_description: orderDescription,
      };

      await createInvoice(params);
      startPolling();
    } catch (err) {
      toast.error(error || 'Failed to create payment');
    }
  };

  const handleCopyAddress = async () => {
    if (!paymentInfo?.pay_address) return;
    
    try {
      await navigator.clipboard.writeText(paymentInfo.pay_address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedCrypto(null);
    onClose();
  };

  const selectedCryptoInfo = useMemo(() => 
    SUPPORTED_CRYPTOS.find(c => c.id === selectedCrypto),
    [selectedCrypto]
  );

  // Generate QR code URL (using QR server)
  const qrCodeUrl = useMemo(() => {
    if (!paymentInfo?.pay_address || !selectedCrypto) return null;
    const qrData = `${selectedCrypto}:${paymentInfo.pay_address}?amount=${paymentInfo.pay_amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  }, [paymentInfo, selectedCrypto]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">₿</span>
            Pay with Crypto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Currency */}
          {!paymentInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(amount)}
                </p>
              </div>

              <CryptoCurrencySelector
                value={selectedCrypto}
                onChange={setSelectedCrypto}
                disabled={isCreating}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleCreateInvoice}
                disabled={!selectedCrypto || isCreating}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    Continue with {selectedCryptoInfo?.symbol || 'Crypto'}
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Payment Details */}
          {paymentInfo && !isConfirmed && !isFailed && !isExpired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  ⏱ Expires in: {timeRemaining}
                </Badge>
              </div>

              {/* Amount */}
              <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/30">
                <p className="text-sm text-muted-foreground">Send exactly</p>
                <p className="text-2xl font-bold font-mono">
                  {paymentInfo.pay_amount} {paymentInfo.pay_currency.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatCurrency(paymentInfo.price_amount)}
                </p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  To this address:
                </p>
                <div 
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={handleCopyAddress}
                >
                  <code className="flex-1 text-xs font-mono break-all">
                    {paymentInfo.pay_address}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {isPolling && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Waiting for payment...</span>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Cancel Payment
              </Button>
            </motion.div>
          )}

          {/* Success State */}
          {isConfirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-6"
            >
              <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Payment Confirmed!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your booking has been confirmed.
                </p>
              </div>
              <Button onClick={handleClose} className="gap-2">
                <Check className="h-4 w-4" />
                Done
              </Button>
            </motion.div>
          )}

          {/* Expired State */}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-6"
            >
              <div className="w-16 h-16 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Payment Expired</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The payment window has expired. Please try again.
                </p>
              </div>
              <Button onClick={() => { reset(); setSelectedCrypto(null); }} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Failed State */}
          {isFailed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-6"
            >
              <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
                <X className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Payment Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Something went wrong with your payment.
                </p>
              </div>
              <Button onClick={() => { reset(); setSelectedCrypto(null); }} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoPaymentModal;
