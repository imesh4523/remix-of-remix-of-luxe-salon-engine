import { useState } from 'react';
import { format } from 'date-fns';
import {
  CreditCard, Store, Calendar, Search, CheckCircle, Clock, Banknote
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAllTransactions } from '@/hooks/useAdminData';
import { useSalons } from '@/hooks/useData';

export const TransactionHistoryTable = () => {
  const [salonFilter, setSalonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: transactions, isLoading } = useAllTransactions({
    salonId: salonFilter !== 'all' ? salonFilter : undefined,
    paymentStatus: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: salons } = useSalons();

  const filteredTransactions = transactions?.filter(t => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        t.salons?.name?.toLowerCase().includes(searchLower) ||
        t.services?.name?.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getPaymentStatusBadge = (method: string, status: string) => {
    if (status === 'paid') {
      return (
        <Badge className="bg-success/20 text-success gap-1">
          <CheckCircle className="h-3 w-3" />
          PAID
        </Badge>
      );
    }
    if (method === 'cash') {
      return (
        <Badge className="bg-warning/20 text-warning gap-1">
          <Banknote className="h-3 w-3" />
          CASH
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success">Completed</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary/20 text-primary">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/20 text-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="font-serif flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            All Transactions
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-40 sm:w-48 bg-muted/50"
              />
            </div>
            
            {/* Salon Filter */}
            <Select value={salonFilter} onValueChange={setSalonFilter}>
              <SelectTrigger className="w-40 bg-muted/50">
                <SelectValue placeholder="All Salons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salons</SelectItem>
                {salons?.filter(s => s.status === 'approved').map(salon => (
                  <SelectItem key={salon.id} value={salon.id}>
                    {salon.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-muted/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Salon</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Vendor Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {format(new Date(transaction.booking_date), 'MMM d')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.start_time}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[120px]">
                          {transaction.salons?.name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="truncate max-w-[100px] block">
                        {transaction.services?.name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">
                        Rs. {Number(transaction.total_amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(transaction.payment_method, transaction.payment_status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-medium">
                        Rs. {Number(transaction.platform_commission).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-success font-medium">
                        Rs. {Number(transaction.vendor_payout).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getBookingStatusBadge(transaction.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
