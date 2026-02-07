import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  network?: string;
}

// Popular cryptocurrencies supported by NOWPayments
const AVAILABLE_CURRENCIES: CryptoCurrency[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { id: 'usdttrc20', name: 'Tether', symbol: 'USDT', network: 'TRC20' },
  { id: 'usdterc20', name: 'Tether', symbol: 'USDT', network: 'ERC20' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC' },
  { id: 'bnbbsc', name: 'BNB', symbol: 'BNB', network: 'BSC' },
  { id: 'xrp', name: 'Ripple', symbol: 'XRP' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'trx', name: 'Tron', symbol: 'TRX' },
  { id: 'sol', name: 'Solana', symbol: 'SOL' },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC' },
];

interface CryptoCurrencySelectorProps {
  selectedCurrencies: string;
  onChange: (currencies: string) => void;
  isSaving: boolean;
}

export const CryptoCurrencySelector = ({
  selectedCurrencies,
  onChange,
  isSaving,
}: CryptoCurrencySelectorProps) => {
  const selectedArray = selectedCurrencies.split(',').filter(Boolean);

  const toggleCurrency = (currencyId: string) => {
    if (selectedArray.includes(currencyId)) {
      // Remove currency (but keep at least one)
      if (selectedArray.length > 1) {
        const newCurrencies = selectedArray.filter(c => c !== currencyId);
        onChange(newCurrencies.join(','));
      }
    } else {
      // Add currency
      const newCurrencies = [...selectedArray, currencyId];
      onChange(newCurrencies.join(','));
    }
  };

  const isSelected = (currencyId: string) => selectedArray.includes(currencyId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Accepted Cryptocurrencies</Label>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground">
        Select which cryptocurrencies customers can pay with
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AVAILABLE_CURRENCIES.map((currency) => (
          <button
            key={currency.id}
            type="button"
            onClick={() => toggleCurrency(currency.id)}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all",
              isSelected(currency.id)
                ? "bg-primary/10 border-primary text-foreground"
                : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
              isSelected(currency.id) ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {isSelected(currency.id) && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currency.symbol}</div>
              {currency.network && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                  {currency.network}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selected: {selectedArray.length} currencies
      </p>
    </div>
  );
};
