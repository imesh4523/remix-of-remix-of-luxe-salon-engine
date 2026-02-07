import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

export const SUPPORTED_CRYPTOS: CryptoCurrency[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'usdttrc20', name: 'USDT (TRC20)', symbol: 'USDT', icon: '₮' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', icon: 'Ł' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', icon: '◈' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', icon: '✕' },
];

interface CryptoCurrencySelectorProps {
  value: string | null;
  onChange: (currency: string) => void;
  disabled?: boolean;
}

export const CryptoCurrencySelector = ({
  value,
  onChange,
  disabled = false,
}: CryptoCurrencySelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Select cryptocurrency</p>
      <div className="grid grid-cols-4 gap-2">
        {SUPPORTED_CRYPTOS.map((crypto) => {
          const isSelected = value === crypto.id;
          
          return (
            <motion.button
              key={crypto.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => !disabled && onChange(crypto.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-xl transition-all',
                'border-2',
                isSelected
                  ? 'bg-primary/10 border-primary shadow-glow-rose'
                  : 'bg-muted/30 border-transparent hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-xl font-bold mb-1">{crypto.icon}</span>
              <span className={cn(
                'text-xs font-medium',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {crypto.symbol}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoCurrencySelector;
