import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Staff } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StaffCardProps {
  staff: Staff;
  isSelected?: boolean;
  onSelect?: (staff: Staff) => void;
}

export const StaffCard = ({ staff, isSelected, onSelect }: StaffCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(staff)}
      className={cn(
        'glass-card p-3 sm:p-4 cursor-pointer transition-all duration-300 overflow-hidden',
        isSelected
          ? 'border-primary shadow-glow-rose'
          : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-2 ring-primary/20">
            <AvatarImage src={staff.avatar_url || undefined} alt={staff.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm sm:text-lg">
              {staff.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{staff.name}</h4>
          <p className="text-xs sm:text-sm text-primary truncate">{staff.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
            {staff.bio}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StaffCard;
