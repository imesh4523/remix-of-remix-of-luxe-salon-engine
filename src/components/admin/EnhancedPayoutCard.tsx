import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Store, CreditCard, Building2, CheckCircle, XCircle, Clock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayoutRequests, useProcessPayout, PayoutRequest } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';

interface PayoutCardProps {
  payout: PayoutRequest;
  onProcess: (id: string, status: 'approved' | 'rejected') => void;
  processing: boolean;
}

const PayoutCard = ({ payout, onProcess, processing }: PayoutCardProps) => {
  const bankDetails = payout.bank_details as {
    bank_name?: string; 
    account_number?: string; 
    account_holder?: string;
  } | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-muted/30 rounded-xl space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{payout.salons?.name || 'Unknown Salon'}</p>
            <p className="text-sm text-muted-foreground">
              Requested: {format(new Date(payout.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">
            Rs. {Number(payout.amount).toLocaleString()}
          </p>
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        </div>
      </div>
      
      {/* Bank Details */}
      {bankDetails && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Bank Details</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="font-medium">{bankDetails.bank_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="font-medium">
                {bankDetails.account_number 
                  ? `***${bankDetails.account_number.slice(-4)}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Holder</p>
              <p className="font-medium">{bankDetails.account_holder || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1 gap-2 bg-success hover:bg-success/90"
          onClick={() => onProcess(payout.id, 'approved')}
          disabled={processing}
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => onProcess(payout.id, 'rejected')}
          disabled={processing}
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Reject
        </Button>
      </div>
    </motion.div>
  );
};

export const EnhancedPayoutCard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const { user } = useAuth();
  const { data: payouts, isLoading } = usePayoutRequests(activeTab);
  const processPayout = useProcessPayout();

  const handleProcess = async (payoutId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    await processPayout.mutateAsync({
      payoutId,
      status,
      processedBy: user.id,
    });
  };

  const pendingCount = payouts?.filter(p => p.status === 'pending').length || 0;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payout Requests
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="gap-1">
              Pending
              {pendingCount > 0 && (
                <Badge className="h-5 w-5 p-0 justify-center bg-warning/20 text-warning">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : payouts && payouts.filter(p => p.status === 'pending').length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {payouts.filter(p => p.status === 'pending').map((payout) => (
                  <PayoutCard
                    key={payout.id}
                    payout={payout}
                    onProcess={handleProcess}
                    processing={processPayout.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                <p>No pending payout requests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-0">
            {payouts && payouts.filter(p => p.status === 'approved').length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {payouts.filter(p => p.status === 'approved').map((payout) => (
                  <div key={payout.id} className="p-3 bg-success/10 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payout.salons?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payout.processed_at || payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-bold text-success">
                      Rs. {Number(payout.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No approved payouts</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-0">
            {payouts && payouts.filter(p => p.status === 'rejected').length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {payouts.filter(p => p.status === 'rejected').map((payout) => (
                  <div key={payout.id} className="p-3 bg-destructive/10 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payout.salons?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payout.processed_at || payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-bold text-destructive">
                      Rs. {Number(payout.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rejected payouts</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
