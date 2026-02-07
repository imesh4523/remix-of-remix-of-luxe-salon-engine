import { motion } from 'framer-motion';
import { Booking } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PaymentBadge } from '@/components/PaymentBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  showActions?: boolean;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const statusStyles: Record<Booking['status'], string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

const statusLabels: Record<Booking['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BookingCard = ({ booking, onClick, showActions, onConfirm, onCancel }: BookingCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="glass-card p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:shadow-glow-rose hover:border-primary/30 overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/20 shrink-0">
          <AvatarImage src={booking.salon?.logo || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm">
            {booking.salon?.name?.[0] || 'S'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Header with name and badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-semibold text-foreground text-sm sm:text-base truncate">
                {booking.salon?.name || 'Salon'}
              </h3>
              <p className="text-xs sm:text-sm text-primary truncate">{booking.service?.name}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Payment indicator */}
              <PaymentBadge 
                paymentMethod={booking.payment_method || 'cash'} 
                paymentStatus={booking.payment_status || 'pending'}
                className="text-xs px-1.5 py-0.5"
                showIcon={true}
              />
              <Badge className={cn('text-xs px-2 py-0.5', statusStyles[booking.status])}>
                {statusLabels[booking.status]}
              </Badge>
            </div>
          </div>

          {/* Date, time, location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{booking.start_time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{booking.salon?.city}</span>
            </div>
          </div>

          {/* Footer with staff and price */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                <AvatarImage src={booking.staff?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {booking.staff?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {booking.staff?.name}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {showActions && booking.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirm?.(booking.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel?.(booking.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <span className="font-semibold text-foreground text-sm sm:text-base ml-1">
                {formatCurrency(booking.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCard;
