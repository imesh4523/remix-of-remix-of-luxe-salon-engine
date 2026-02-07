import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Review } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-4 overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
          <AvatarImage src={review.customer?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
            {review.customer?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
                {review.customer?.full_name || 'Anonymous'}
              </h4>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    i < review.rating
                      ? 'fill-accent text-accent'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{review.comment}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
