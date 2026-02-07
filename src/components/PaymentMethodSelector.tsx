import { motion } from 'framer-motion';
import { Lock, Check, Wallet, CreditCard, Bitcoin, Coins, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'cash' | 'online' | 'crypto';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  showCrypto?: boolean;
}

// Custom Cash Icon Component for unique look
const CashIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className="h-6 w-6"
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" strokeWidth="2" />
  </svg>
);

// Custom Card Icon Component
const CardIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className="h-6 w-6"
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </svg>
);

// Custom Bitcoin/Crypto Icon Component
const CryptoIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="h-6 w-6"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/>
    <path d="M14.5 10.5c0-1.1-.9-2-2-2H10V14h2.5c1.1 0 2-.9 2-2v-1.5zM11 9.5h1.5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5H11V9.5zm2.5 3c0 .28-.22.5-.5.5H11v-2h1.5c.28 0 .5.22.5.5v1zM9 7h1v2H9zM9 15h1v2H9zM13 7h1v2h-1zM13 15h1v2h-1z"/>
  </svg>
);

const paymentOptions = [
  {
    id: 'cash' as PaymentMethod,
    title: 'Cash at Salon',
    description: 'Pay when you arrive',
    IconComponent: CashIcon,
    iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    selectedBg: 'bg-primary/5 border-primary',
  },
  {
    id: 'online' as PaymentMethod,
    title: 'Pay Now',
    description: 'Secure online payment',
    IconComponent: CardIcon,
    iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    selectedBg: 'bg-primary/5 border-primary',
    badge: { icon: Shield, text: 'Secure', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  },
  {
    id: 'crypto' as PaymentMethod,
    title: 'Crypto',
    description: 'Bitcoin, ETH, USDT & more',
    IconComponent: CryptoIcon,
    iconBg: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    selectedBg: 'bg-primary/5 border-primary',
    badge: { icon: Shield, text: 'Secure', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  },
];

export const PaymentMethodSelector = ({ value, onChange, showCrypto = true }: PaymentMethodSelectorProps) => {
  const options = showCrypto ? paymentOptions : paymentOptions.filter(o => o.id !== 'crypto');
  
  return (
    <div className="space-y-3">
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Select payment method
      </p>
      
      {options.map((option, index) => {
        const isSelected = value === option.id;
        const IconComponent = option.IconComponent;
        
        return (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300',
              'border-2',
              isSelected
                ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                : 'bg-card/50 border-border/50 hover:bg-muted/50 hover:border-border'
            )}
          >
            {/* Selection indicator - circular checkbox */}
            <div
              className={cn(
                'w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary scale-110'
                  : 'border-muted-foreground/40 hover:border-muted-foreground/60'
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            
            {/* Icon Container - Professional gradient background */}
            <div 
              className={cn(
                'w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0',
                'shadow-sm transition-transform duration-200',
                option.iconBg,
                isSelected && 'scale-105'
              )}
            >
              <div className={cn(option.iconColor)}>
                <IconComponent />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                  'font-semibold text-sm sm:text-base transition-colors',
                  isSelected ? 'text-foreground' : 'text-foreground/80'
                )}>
                  {option.title}
                </p>
                {option.badge && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium',
                      option.badge.color
                    )}
                  >
                    <option.badge.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {option.badge.text}
                  </motion.span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {option.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
