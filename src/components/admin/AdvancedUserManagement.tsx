import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, UserPlus, Wallet, Ban, CheckCircle,
  MoreVertical, ChevronRight, Mail, Phone, Shield,
  TrendingUp, TrendingDown, Eye, Key, Globe, Clock,
  Download, RefreshCw, AlertTriangle, UserX, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllUsers, useWalletAdjustment, useToggleWalletFreeze } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

// Suspend user mutation
const useSuspendUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      suspend, 
      reason 
    }: { 
      userId: string; 
      suspend: boolean; 
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: suspend,
          suspended_at: suspend ? new Date().toISOString() : null,
          suspended_reason: suspend ? reason : null,
        })
        .eq('user_id', userId);
      
      if (error) throw error;

      // Log the action
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'user',
        entity_id: userId,
        action: suspend ? 'suspend_user' : 'unsuspend_user',
        details: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });
};

// Update user role mutation
const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: 'customer' | 'vendor' | 'admin';
    }) => {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        throw new Error('User already has this role');
      }

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;

      // Log the action
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'user_role',
        entity_id: userId,
        action: 'add_role',
        details: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Role added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
};

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

interface SuspendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const SuspendDialog = ({ isOpen, onClose, user }: SuspendDialogProps) => {
  const [reason, setReason] = useState('');
  const suspendUser = useSuspendUser();

  const handleSuspend = async () => {
    if (!user) return;
    
    await suspendUser.mutateAsync({
      userId: user.user_id,
      suspend: !user.is_suspended,
      reason,
    });
    
    setReason('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            {user.is_suspended ? (
              <UserCheck className="h-5 w-5 text-success" />
            ) : (
              <UserX className="h-5 w-5 text-destructive" />
            )}
            {user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
          </DialogTitle>
          <DialogDescription>
            {user.is_suspended 
              ? `Restore access for ${user.full_name}`
              : `This will prevent ${user.full_name} from accessing their account`
            }
          </DialogDescription>
        </DialogHeader>

        {!user.is_suspended && (
          <div className="space-y-2">
            <Label>Reason for suspension</Label>
            <Textarea
              placeholder="Enter the reason for suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-muted/50"
              rows={3}
            />
          </div>
        )}

        {user.is_suspended && user.suspended_reason && (
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">Previous suspension reason:</p>
            <p className="text-sm mt-1">{user.suspended_reason}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSuspend}
            variant={user.is_suspended ? 'default' : 'destructive'}
            disabled={suspendUser.isPending}
          >
            {suspendUser.isPending 
              ? 'Processing...' 
              : user.is_suspended ? 'Unsuspend User' : 'Suspend User'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface UserDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const UserDetailDialog = ({ isOpen, onClose, user }: UserDetailDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p>{user.full_name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground font-normal">{user.user_id}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {user.phone || 'Not provided'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(user.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* IP Tracking */}
          <div className="p-4 bg-muted/50 rounded-xl space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              IP Information
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Registration IP</p>
                <p>{user.registration_ip || 'Not tracked'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Login IP</p>
                <p>{user.last_login_ip || 'Not tracked'}</p>
              </div>
            </div>
            {user.last_login_at && (
              <div>
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="text-sm">{format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')}</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Account Status</p>
              {user.is_suspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge className="bg-success/20 text-success">Active</Badge>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Wallet Status</p>
              {user.wallet?.is_frozen ? (
                <Badge variant="destructive">Frozen</Badge>
              ) : (
                <Badge className="bg-success/20 text-success">Active</Badge>
              )}
            </div>
          </div>

          {user.is_suspended && user.suspended_reason && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive mb-1">Suspension Reason:</p>
              <p className="text-sm">{user.suspended_reason}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdvancedUserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: users, isLoading, refetch } = useAllUsers();
  const suspendUser = useSuspendUser();

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.user_id.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as 'admin' | 'customer' | 'vendor');
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.is_suspended) ||
      (statusFilter === 'suspended' && user.is_suspended);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return <Badge className="bg-destructive/20 text-destructive">Admin</Badge>;
    }
    if (roles.includes('vendor')) {
      return <Badge className="bg-accent/20 text-accent">Vendor</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary">Customer</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkSuspend = async (suspend: boolean) => {
    for (const userId of selectedUsers) {
      await suspendUser.mutateAsync({
        userId,
        suspend,
        reason: 'Bulk action by admin',
      });
    }
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Advanced User Management</h2>
          <p className="text-muted-foreground">
            Search, filter, and manage all users with bulk actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 rounded-xl flex items-center justify-between"
        >
          <p className="text-sm">
            <span className="font-semibold">{selectedUsers.length}</span> users selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkSuspend(true)}
              className="gap-2 text-destructive"
            >
              <Ban className="h-4 w-4" />
              Suspend All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkSuspend(false)}
              className="gap-2 text-success"
            >
              <CheckCircle className="h-4 w-4" />
              Unsuspend All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedUsers([])}
            >
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {([
          { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'text-primary' },
          { label: 'Vendors', value: users?.filter(u => u.roles.includes('vendor')).length || 0, icon: Shield, color: 'text-accent' },
          { label: 'Suspended', value: users?.filter((u: any) => u.is_suspended).length || 0, icon: UserX, color: 'text-destructive' },
          { label: 'Frozen Wallets', value: users?.filter(u => u.wallet?.is_frozen).length || 0, icon: Ban, color: 'text-warning' },
        ] as const).map((stat, i) => (
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
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
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
                          <Checkbox 
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user.user_id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
                              }
                            }}
                          />
                        </TableCell>
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
                          {user.is_suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge className="bg-success/20 text-success">Active</Badge>
                          )}
                        </TableCell>
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
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
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
                              <DropdownMenuItem 
                                className="gap-2 text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSuspendDialogOpen(true);
                                }}
                              >
                                {user.is_suspended ? (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    Unsuspend User
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4" />
                                    Suspend User
                                  </>
                                )}
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

      {/* Dialogs */}
      <WalletDialog
        isOpen={walletDialogOpen}
        onClose={() => {
          setWalletDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <SuspendDialog
        isOpen={suspendDialogOpen}
        onClose={() => {
          setSuspendDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <UserDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};
