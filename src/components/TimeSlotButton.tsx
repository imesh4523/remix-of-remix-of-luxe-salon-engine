import { memo } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotButtonProps {
  time: string;
  available?: boolean;
  isSelected?: boolean;
  onSelect?: (time: string) => void;
}

export const TimeSlotButton = memo(({
  time,
  available = true,
  isSelected,
  onSelect,
}: TimeSlotButtonProps) => {
  return (
    <button
      onClick={() => available && onSelect?.(time)}
      disabled={!available}
      className={cn(
        // Base styles with CSS-only transitions (GPU optimized)
        'relative flex flex-col items-center justify-center px-2 py-2 rounded-lg text-sm font-medium',
        'transition-all duration-200 transform-gpu will-change-transform',
        'active:scale-95',
        
        isSelected
          ? 'bg-primary text-primary-foreground shadow-glow-rose scale-[1.02]'
          : available
          ? 'bg-card/80 border border-border/50 hover:border-primary/50 hover:bg-card hover:scale-[1.02]'
          : 'bg-destructive/10 border border-destructive/30 cursor-not-allowed'
      )}
    >
      {!available ? (
        <>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-destructive/70" />
            <span className="text-[9px] text-destructive font-semibold uppercase tracking-wide">
              Booked
            </span>
          </div>
          <span className="line-through text-muted-foreground text-xs mt-0.5">
            {time}
          </span>
        </>
      ) : (
        <span>{time}</span>
      )}
    </button>
  );
});

TimeSlotButton.displayName = 'TimeSlotButton';

export default TimeSlotButton;
