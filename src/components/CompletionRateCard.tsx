import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompletionRateCardProps {
  rate: number;
  completed: number;
  total: number;
  previousRate?: number;
  className?: string;
}

export const CompletionRateCard = ({ 
  rate, 
  completed, 
  total, 
  previousRate,
  className 
}: CompletionRateCardProps) => {
  const rateChange = previousRate !== undefined ? rate - previousRate : 0;
  const isPositive = rateChange >= 0;
  
  // Calculate the circumference and offset for the circular progress
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  
  // Determine color based on rate
  const getColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-destructive';
  };
  
  const getStrokeColor = (rate: number) => {
    if (rate >= 90) return 'stroke-emerald-500';
    if (rate >= 70) return 'stroke-amber-500';
    return 'stroke-destructive';
  };

  return (
    <Card className={cn('glass-card border-border/50', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
              {/* Progress circle */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className={getStrokeColor(rate)}
                initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-xl font-bold', getColor(rate))}>
                {rate}%
              </span>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completed} of {total} bookings completed
            </p>
            
            {previousRate !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                isPositive ? 'text-emerald-500' : 'text-destructive'
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? '+' : ''}{rateChange}% vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionRateCard;
