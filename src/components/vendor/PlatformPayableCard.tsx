import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, DollarSign, Info, TrendingDown, Snowflake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSalonPlatformPayable, usePaymentMethodBreakdown } from '@/hooks/useVendorFinancials';
import { formatCurrency } from '@/lib/format';

interface PlatformPayableCardProps {
  salonId: string;
  walletBalance: number;
}

export const PlatformPayableCard = ({ salonId, walletBalance }: PlatformPayableCardProps) => {
  const { data: payableData, isLoading: payableLoading } = useSalonPlatformPayable(salonId);
  const { data: breakdown, isLoading: breakdownLoading } = usePaymentMethodBreakdown(salonId);

  const isLoading = payableLoading || breakdownLoading;
  const platformPayable = payableData?.platformPayable || 0;
  const commissionRate = payableData?.commissionRate || 7;
  const creditLimit = payableData?.creditLimit || 10000;
  const usagePercent = payableData?.usagePercent || 0;
  const isFrozen = payableData?.isFrozen || false;
  const trustLevel = payableData?.trustLevel || 'new';

  // Calculate available for payout
  const availableForPayout = Math.max(0, walletBalance - platformPayable);

  return (
    <Card className={`glass-card border-border/50 ${isFrozen ? 'border-destructive/50' : ''}`}>
      <CardHeader>
        <CardTitle className="font-serif flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isFrozen ? (
              <Snowflake className="h-5 w-5 text-destructive" />
            ) : (
              <DollarSign className="h-5 w-5 text-primary" />
            )}
            Commission & Payables
          </span>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="font-normal capitalize">
                    {trustLevel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your trust level determines your credit limit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="font-normal">
                    {commissionRate}% Fee
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your platform commission rate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Frozen Store Warning */}
            {isFrozen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-destructive/10 border-2 border-destructive/50 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <Snowflake className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-destructive text-lg">STORE TEMPORARILY SUSPENDED</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your store has been suspended because your platform payable ({formatCurrency(platformPayable)}) exceeds your credit limit ({formatCurrency(creditLimit)}).
                    </p>
                    <p className="text-sm text-foreground mt-2 font-medium">
                      Pay now to instantly reactivate your store.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Credit Limit Progress */}
            <div className={`p-4 rounded-xl ${
              isFrozen 
                ? 'bg-destructive/10 border border-destructive/30' 
                : usagePercent >= 80 
                ? 'bg-warning/10 border border-warning/30'
                : 'bg-muted/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Platform Payable</span>
                <span className={`text-xl font-bold ${
                  isFrozen ? 'text-destructive' : usagePercent >= 80 ? 'text-warning' : ''
                }`}>
                  {formatCurrency(platformPayable)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Progress
                  value={usagePercent}
                  className={`h-3 ${
                    isFrozen
                      ? '[&>div]:bg-destructive'
                      : usagePercent >= 80
                      ? '[&>div]:bg-warning'
                      : usagePercent >= 50
                      ? '[&>div]:bg-accent'
                      : '[&>div]:bg-success'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round(usagePercent)}% of limit used</span>
                  <span>Credit Limit: {formatCurrency(creditLimit)}</span>
                </div>
              </div>

              {usagePercent >= 80 && !isFrozen && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-warning/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-xs text-warning">
                    Warning: Your store will be temporarily suspended when you reach the credit limit.
                  </p>
                </div>
              )}
            </div>

            {/* Wallet Balance & Available */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Wallet Balance</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(walletBalance)}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Available for Payout</span>
                </div>
                <p className="text-xl font-bold text-success">{formatCurrency(availableForPayout)}</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            {breakdown && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Payment Method Breakdown (Completed Bookings)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Cash</p>
                    <p className="font-semibold">{formatCurrency(breakdown.cash)}</p>
                    <p className="text-xs text-warning">
                      -{formatCurrency(breakdown.cash_commission)} fee
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Online</p>
                    <p className="font-semibold">{formatCurrency(breakdown.online)}</p>
                    <p className="text-xs text-success">
                      ✓ Settled
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Crypto</p>
                    <p className="font-semibold">{formatCurrency(breakdown.crypto)}</p>
                    <p className="text-xs text-success">
                      ✓ Settled
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
              <p>
                <strong>Cash bookings:</strong> Commission is added to "Platform Payable" when completed.
              </p>
              <p className="mt-1">
                <strong>Online/Crypto:</strong> Commission is automatically deducted, and your share is credited to your wallet.
              </p>
            </div>

            {platformPayable > 0 && (
              <Button 
                variant={isFrozen ? 'default' : 'outline'} 
                className={`w-full gap-2 ${isFrozen ? 'bg-primary hover:bg-primary/90' : ''}`}
              >
                <CreditCard className="h-4 w-4" />
                {isFrozen 
                  ? `Pay ${formatCurrency(platformPayable)} to Reactivate`
                  : `Settle Commission (${formatCurrency(platformPayable)})`
                }
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
