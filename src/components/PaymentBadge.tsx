import { BadgeCheck, Banknote, Bitcoin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'cash' | 'online' | 'crypto';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface PaymentBadgeProps {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  className?: string;
  showIcon?: boolean;
}

export const PaymentBadge = ({ 
  paymentMethod, 
  paymentStatus, 
  className,
  showIcon = true 
}: PaymentBadgeProps) => {
  // If paid, show PAID badge with verified icon
  if (paymentStatus === 'paid') {
    return (
      <Badge 
        className={cn(
          'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1',
          className
        )}
      >
        {showIcon && <BadgeCheck className="h-3 w-3" />}
        PAID
      </Badge>
    );
  }
  
  // If cash method, show CASH badge
  if (paymentMethod === 'cash') {
    return (
      <Badge 
        className={cn(
          'bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1',
          className
        )}
      >
        {showIcon && <Banknote className="h-3 w-3" />}
        CASH
      </Badge>
    );
  }
  
  // If crypto but not paid yet (pending), show CRYPTO badge
  if (paymentMethod === 'crypto' && paymentStatus === 'pending') {
    return (
      <Badge 
        className={cn(
          'bg-orange-500/20 text-orange-600 border-orange-500/30 gap-1',
          className
        )}
      >
        {showIcon && <Bitcoin className="h-3 w-3" />}
        CRYPTO
      </Badge>
    );
  }
  
  // If online but not paid yet (pending), show ONLINE badge
  if (paymentMethod === 'online' && paymentStatus === 'pending') {
    return (
      <Badge 
        className={cn(
          'bg-blue-500/20 text-blue-600 border-blue-500/30',
          className
        )}
      >
        ONLINE
      </Badge>
    );
  }
  
  // If failed or refunded
  if (paymentStatus === 'failed') {
    return (
      <Badge 
        className={cn(
          'bg-destructive/20 text-destructive border-destructive/30',
          className
        )}
      >
        FAILED
      </Badge>
    );
  }
  
  if (paymentStatus === 'refunded') {
    return (
      <Badge 
        className={cn(
          'bg-muted text-muted-foreground border-muted-foreground/30',
          className
        )}
      >
        REFUNDED
      </Badge>
    );
  }
  
  return null;
};

export default PaymentBadge;
