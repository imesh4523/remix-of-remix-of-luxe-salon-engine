import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Store, AlertCircle, CheckCircle2, Clock,
  ArrowUpRight, Search, Filter, Snowflake, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePlatformReceivables, useCollectCommission } from '@/hooks/useAdminFinancials';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export const PlatformReceivables = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<{
    id: string;
    name: string;
    payable: number;
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectNotes, setCollectNotes] = useState('');

  const { data: receivables, isLoading } = usePlatformReceivables();
  const collectCommission = useCollectCommission();

  const filteredReceivables = receivables?.filter(
    (r) => r.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalReceivable = receivables?.reduce((sum, r) => sum + r.platform_payable, 0) || 0;
  const salonsWithDebt = receivables?.filter((r) => r.platform_payable > 0).length || 0;

  const handleCollect = async () => {
    if (!selectedSalon || !collectAmount) return;
    
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedSalon.payable) {
      toast.error('Amount cannot exceed payable amount');
      return;
    }

    await collectCommission.mutateAsync({
      salonId: selectedSalon.id,
      amount,
      notes: collectNotes,
    });

    setCollectDialogOpen(false);
    setSelectedSalon(null);
    setCollectAmount('');
    setCollectNotes('');
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-warning" />
          Platform Receivables
          <Badge variant="secondary" className="ml-2">
            {salonsWithDebt} salons
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">Total Receivable</span>
            </div>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalReceivable)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              From cash bookings
            </p>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Salons with Debt</span>
            </div>
            <p className="text-2xl font-bold">{salonsWithDebt}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending settlement
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search salons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        {/* Salon List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredReceivables.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredReceivables.map((salon) => {
              const usagePercent = salon.usage_percent || 0;
              const isFrozen = salon.is_frozen || false;
              
              return (
                <motion.div
                  key={salon.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-xl transition-colors ${
                    isFrozen
                      ? 'bg-destructive/10 border border-destructive/30'
                      : usagePercent >= 80
                      ? 'bg-warning/10 border border-warning/30'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isFrozen
                          ? 'bg-destructive/20'
                          : salon.platform_payable > 0
                          ? usagePercent >= 80 ? 'bg-warning/20' : 'bg-muted/50'
                          : 'bg-success/20'
                      }`}>
                        {isFrozen ? (
                          <Snowflake className="h-5 w-5 text-destructive" />
                        ) : usagePercent >= 80 ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : salon.platform_payable > 0 ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{salon.name}</p>
                          {isFrozen && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Snowflake className="h-3 w-3" />
                              Frozen
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{salon.city}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {salon.trust_level || 'new'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold ${
                          isFrozen ? 'text-destructive' : usagePercent >= 80 ? 'text-warning' : salon.platform_payable > 0 ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                          {formatCurrency(salon.platform_payable)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {formatCurrency(salon.credit_limit)} ({Math.round(usagePercent)}%)
                        </p>
                      </div>
                      {salon.platform_payable > 0 && (
                        <Button
                          size="sm"
                          variant={isFrozen ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedSalon({
                              id: salon.id,
                              name: salon.name,
                              payable: salon.platform_payable,
                            });
                            setCollectAmount(salon.platform_payable.toString());
                            setCollectDialogOpen(true);
                          }}
                        >
                          {isFrozen ? 'Unfreeze' : 'Collect'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Credit Limit Progress Bar */}
                  {salon.platform_payable > 0 && (
                    <Progress
                      value={usagePercent}
                      className={`h-1.5 mt-2 ${
                        isFrozen
                          ? '[&>div]:bg-destructive'
                          : usagePercent >= 80
                          ? '[&>div]:bg-warning'
                          : usagePercent >= 50
                          ? '[&>div]:bg-accent'
                          : ''
                      }`}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
            <p>No pending receivables</p>
          </div>
        )}

        {/* Collect Dialog */}
        <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
          <DialogContent className="glass-card border-border/50">
            <DialogHeader>
              <DialogTitle className="font-serif">Collect Commission</DialogTitle>
              <DialogDescription>
                Record commission payment from {selectedSalon?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-warning/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Outstanding Amount</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(selectedSalon?.payable || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Amount Collected (Rs.)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Payment reference, method, etc."
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCollectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCollect}
                disabled={!collectAmount || collectCommission.isPending}
              >
                {collectCommission.isPending ? 'Processing...' : 'Confirm Collection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
