import { motion } from 'framer-motion';
import { Clock, Check } from 'lucide-react';
import { Service } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onSelect?: (service: Service) => void;
}

export const ServiceCard = ({ service, isSelected, onSelect }: ServiceCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(service)}
      className={cn(
        'glass-card p-3 sm:p-4 cursor-pointer transition-all duration-300 overflow-hidden',
        isSelected
          ? 'border-primary shadow-glow-rose'
          : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{service.name}</h4>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
            {service.description}
          </p>
          <div className="flex items-center gap-4 mt-2 sm:mt-3">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {service.duration_minutes} min
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base sm:text-lg font-semibold text-primary">
            {formatCurrency(service.price)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
