import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, UserPlus, Wallet, Ban, CheckCircle,
  MoreVertical, ChevronRight, Mail, Phone, Shield,
  TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllUsers, useWalletAdjustment, useToggleWalletFreeze } from '@/hooks/useAdminData';
import { format } from 'date-fns';

interface WalletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    user_id: string;
    full_name: string | null;
    wallet?: { id: string; balance: number; is_frozen: boolean } | null;
  } | null;
}

const WalletDialog = ({ isOpen, onClose, user }: WalletDialogProps) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [description, setDescription] = useState('');

  const walletAdjustment = useWalletAdjustment();
  const toggleFreeze = useToggleWalletFreeze();

  const handleSubmit = async () => {
    if (!user || !amount) return;

    await walletAdjustment.mutateAsync({
      userId: user.user_id,
      amount: parseFloat(amount),
      type,
      description: description || `Manual ${type} by admin`,
    });

    setAmount('');
    setDescription('');
    onClose();
  };

  const handleFreeze = async () => {
    if (!user?.wallet) return;
    await toggleFreeze.mutateAsync({
      walletId: user.wallet.id,
      freeze: !user.wallet.is_frozen,
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Control - {user.full_name}
          </DialogTitle>
          <DialogDescription>
            Current Balance: <span className="text-primary font-semibold">
              Rs. {user.wallet?.balance?.toLocaleString() || '0'}
            </span>
            {user.wallet?.is_frozen && (
              <Badge variant="destructive" className="ml-2">Frozen</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={type === 'credit' ? 'default' : 'outline'}
              onClick={() => setType('credit')}
              className="flex-1 gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Credit
            </Button>
            <Button
              variant={type === 'debit' ? 'destructive' : 'outline'}
              onClick={() => setType('debit')}
              className="flex-1 gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Debit
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Amount (Rs.)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Reason for adjustment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {user.wallet && (
            <Button
              variant="outline"
              onClick={handleFreeze}
              className={user.wallet.is_frozen ? 'text-success' : 'text-destructive'}
              disabled={toggleFreeze.isPending}
            >
              {user.wallet.is_frozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!amount || walletAdjustment.isPending}
            className={type === 'credit' ? 'bg-primary' : 'bg-destructive'}
          >
            {walletAdjustment.isPending ? 'Processing...' : `${type === 'credit' ? 'Add' : 'Deduct'} Funds`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  const { data: users, isLoading } = useAllUsers();

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  ) || [];

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return <Badge className="bg-destructive/20 text-destructive">Admin</Badge>;
    }
    if (roles.includes('vendor')) {
      return <Badge className="bg-accent/20 text-accent">Vendor</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary">Customer</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage all users, vendors, and their wallets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-muted/50"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'text-primary' },
          { label: 'Vendors', value: users?.filter(u => u.roles.includes('vendor')).length || 0, icon: Shield, color: 'text-accent' },
          { label: 'Total Balance', value: `Rs. ${users?.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0).toLocaleString()}`, icon: Wallet, color: 'text-primary' },
          { label: 'Frozen Wallets', value: users?.filter(u => u.wallet?.is_frozen).length || 0, icon: Ban, color: 'text-destructive' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Users Table */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-border/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.phone || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.roles)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={user.wallet?.is_frozen ? 'text-destructive' : 'text-primary'}>
                              Rs. {user.wallet?.balance?.toLocaleString() || '0'}
                            </span>
                            {user.wallet?.is_frozen && (
                              <Badge variant="destructive" className="text-xs">Frozen</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-border/50">
                              <DropdownMenuItem className="gap-2">
                                <Eye className="h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setWalletDialogOpen(true);
                                }}
                              >
                                <Wallet className="h-4 w-4" />
                                Manage Wallet
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-destructive">
                                <Ban className="h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Dialog */}
      <WalletDialog
        isOpen={walletDialogOpen}
        onClose={() => {
          setWalletDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

// Import the Users icon that was used but not imported
import { Users } from 'lucide-react';
