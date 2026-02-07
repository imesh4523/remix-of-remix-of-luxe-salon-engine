import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, CreditCard, Store,
  PieChart, ArrowUpRight, ArrowDownRight, Percent,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePlatformStats, useSalons } from '@/hooks/useData';
import { usePayoutRequests, useProcessPayout, useUpdateSalonCommission } from '@/hooks/useAdminData';
import { usePlatformReceivablesSummary, useFinancialOverview } from '@/hooks/useAdminFinancials';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { PaymentFlowDiagram } from './PaymentFlowDiagram';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { EnhancedPayoutCard } from './EnhancedPayoutCard';
import { PlatformReceivables } from './PlatformReceivables';

export const FinancialDashboard = () => {
  const [selectedSalon, setSelectedSalon] = useState<{ id: string; name: string; commission_rate: number } | null>(null);
  const [newCommission, setNewCommission] = useState('');
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);

  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: salons, isLoading: salonsLoading } = useSalons();
  const { data: payouts } = usePayoutRequests();
  const { data: receivablesSummary } = usePlatformReceivablesSummary();
  const { data: financialOverview } = useFinancialOverview();
  const updateCommission = useUpdateSalonCommission();

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];
  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

  const handleUpdateCommission = async () => {
    if (!selectedSalon || !newCommission) return;
    await updateCommission.mutateAsync({
      salonId: selectedSalon.id,
      rate: parseFloat(newCommission),
    });
    setCommissionDialogOpen(false);
    setNewCommission('');
    setSelectedSalon(null);
  };

  const financialStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(financialOverview?.totalRevenue || stats?.totalRevenue || 0),
      change: '+22%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Platform Earnings',
      value: formatCurrency(financialOverview?.totalCommissionEarned || stats?.platformEarnings || 0),
      change: `${formatCurrency(financialOverview?.collectedCommission || 0)} collected`,
      trend: 'up',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Pending Receivables',
      value: formatCurrency(receivablesSummary?.total || 0),
      change: `${receivablesSummary?.salonsWithDebt || 0} salons`,
      trend: 'neutral',
      icon: AlertCircle,
      color: 'text-warning',
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(totalPendingAmount),
      change: `${pendingPayouts.length} requests`,
      trend: 'neutral',
      icon: CreditCard,
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Financial Control
        </h2>
        <p className="text-muted-foreground">
          Manage commissions, payouts, and platform earnings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                {statsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                      <p className="text-xl font-bold mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-success" />}
                        {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                        <span className={cn(
                          "text-xs",
                          stat.trend === 'up' ? 'text-success' : stat.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Flow Diagram */}
      <PaymentFlowDiagram />

      {/* Transaction History */}
      <TransactionHistoryTable />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform Receivables - Commission Collection */}
        <PlatformReceivables />

        {/* Pending Payouts */}
        <EnhancedPayoutCard />

        {/* Commission Rates */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Salon Commission Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salonsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : salons && salons.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {salons.filter(s => s.status === 'approved').map((salon) => (
                  <div
                    key={salon.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSalon({ id: salon.id, name: salon.name, commission_rate: salon.commission_rate || 15 });
                      setNewCommission((salon.commission_rate || 15).toString());
                      setCommissionDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{salon.name}</p>
                        <p className="text-xs text-muted-foreground">{salon.city}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary">
                      {salon.commission_rate || 15}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No approved salons</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Update Commission Rate
            </DialogTitle>
            <DialogDescription>
              Set commission rate for {selectedSalon?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Rate</Label>
              <p className="text-2xl font-bold text-primary">{selectedSalon?.commission_rate || 15}%</p>
            </div>

            <div className="space-y-2">
              <Label>New Commission Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Enter new rate"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
                className="bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCommission}
              disabled={!newCommission || updateCommission.isPending}
            >
              {updateCommission.isPending ? 'Updating...' : 'Update Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
