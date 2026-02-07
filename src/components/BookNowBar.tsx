import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface BookNowBarProps {
  startingPrice: number;
  onBookClick: () => void;
}

export const BookNowBar = ({ startingPrice, onBookClick }: BookNowBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
    >
      <div className="glass-card-elevated border-t border-border/50 px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(startingPrice)}</p>
          </div>
          <Button 
            onClick={onBookClick}
            className="gap-2 shadow-glow-rose px-6"
            size="lg"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default BookNowBar;
