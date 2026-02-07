import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Filter, MapPin, Phone, Mail, Star, Calendar,
  CheckCircle, XCircle, Ban, Eye, Edit, Percent, MoreVertical,
  TrendingUp, Users, Clock, AlertTriangle, Loader2, RefreshCw,
  Snowflake, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSalons, useUpdateSalonStatus } from '@/hooks/useData';
import { useUpdateSalonCommission } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Suspend salon mutation
const useSuspendSalon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ salonId, suspend }: { salonId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from('salons')
        .update({ status: suspend ? 'suspended' : 'approved' })
        .eq('id', salonId);
      
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'salon',
        entity_id: salonId,
        action: suspend ? 'suspend_salon' : 'unsuspend_salon',
        details: {},
      });
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(`Salon ${suspend ? 'suspended' : 'reactivated'} successfully`);
    },
    onError: () => {
      toast.error('Failed to update salon status');
    },
  });
};

interface SalonDetailSheetProps {
  salon: any;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, salonId: string) => void;
}

const SalonDetailSheet = ({ salon, isOpen, onClose, onAction }: SalonDetailSheetProps) => {
  if (!salon) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="glass-card border-l border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={salon.logo || undefined} />
              <AvatarFallback className="text-xl">{salon.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-serif text-xl truncate">{salon.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {salon.city}, {salon.address}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                className={
                  salon.status === 'approved'
                    ? 'bg-success/20 text-success'
                    : salon.status === 'suspended'
                    ? 'bg-destructive/20 text-destructive'
                    : salon.status === 'rejected'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-warning/20 text-warning'
                }
              >
                {salon.status}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
              <div className="space-y-2">
                {salon.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salon.phone}</span>
                  </div>
                )}
                {salon.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salon.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Commission Rate */}
            <div className="p-4 bg-primary/10 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Commission Rate</span>
                <span className="text-2xl font-bold text-primary">{salon.commission_rate || 15}%</span>
              </div>
            </div>

            {/* Description */}
            {salon.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-sm bg-muted/30 p-4 rounded-xl">{salon.description}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-medium">{format(new Date(salon.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{format(new Date(salon.updated_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/30 border-0">
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">{salon.rating || '0.0'}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-0">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{salon.review_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 mt-4">
            {salon.status === 'pending' && (
              <>
                <Button 
                  className="w-full gap-2 bg-success hover:bg-success/90"
                  onClick={() => onAction('approve', salon.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Salon
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => onAction('reject', salon.id)}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Salon
                </Button>
              </>
            )}

            {salon.status === 'approved' && (
              <Button 
                variant="destructive"
                className="w-full gap-2"
                onClick={() => onAction('suspend', salon.id)}
              >
                <Snowflake className="h-4 w-4" />
                Suspend Salon
              </Button>
            )}

            {salon.status === 'suspended' && (
              <Button 
                className="w-full gap-2 bg-success hover:bg-success/90"
                onClick={() => onAction('reactivate', salon.id)}
              >
                <Play className="h-4 w-4" />
                Reactivate Salon
              </Button>
            )}

            <Button 
              variant="outline"
              className="w-full gap-2"
              onClick={() => onAction('commission', salon.id)}
            >
              <Percent className="h-4 w-4" />
              Update Commission Rate
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export const SalonManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSalon, setSelectedSalon] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [newCommission, setNewCommission] = useState('');

  const { data: salons, isLoading, refetch } = useSalons();
  const updateStatus = useUpdateSalonStatus();
  const suspendSalon = useSuspendSalon();
  const updateCommission = useUpdateSalonCommission();

  const filteredSalons = salons?.filter(salon => {
    const matchesSearch = 
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || salon.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleAction = async (action: string, salonId: string) => {
    switch (action) {
      case 'approve':
        await updateStatus.mutateAsync({ id: salonId, status: 'approved' });
        break;
      case 'reject':
        await updateStatus.mutateAsync({ id: salonId, status: 'rejected' });
        break;
      case 'suspend':
        await suspendSalon.mutateAsync({ salonId, suspend: true });
        break;
      case 'reactivate':
        await suspendSalon.mutateAsync({ salonId, suspend: false });
        break;
      case 'commission':
        const salon = salons?.find(s => s.id === salonId);
        if (salon) {
          setSelectedSalon(salon);
          setNewCommission((salon.commission_rate || 15).toString());
          setCommissionDialogOpen(true);
        }
        break;
    }
    setDetailSheetOpen(false);
  };

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

  const statusCounts = {
    all: salons?.length || 0,
    pending: salons?.filter(s => s.status === 'pending').length || 0,
    approved: salons?.filter(s => s.status === 'approved').length || 0,
    suspended: salons?.filter(s => s.status === 'suspended').length || 0,
    rejected: salons?.filter(s => s.status === 'rejected').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Salon Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage all registered salons and their settings
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending', color: 'warning' },
          { value: 'approved', label: 'Approved', color: 'success' },
          { value: 'suspended', label: 'Suspended', color: 'destructive' },
          { value: 'rejected', label: 'Rejected', color: 'destructive' },
        ].map(({ value, label, color }) => (
          <Button
            key={value}
            variant={statusFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(value)}
            className="gap-2"
          >
            {label}
            <Badge 
              variant="secondary" 
              className={statusFilter === value ? 'bg-background/20' : ''}
            >
              {statusCounts[value as keyof typeof statusCounts]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search salons by name, city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-muted/50"
        />
      </div>

      {/* Salons Grid - Mobile */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : filteredSalons.length > 0 ? (
          filteredSalons.map((salon) => (
            <motion.div
              key={salon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedSalon(salon);
                setDetailSheetOpen(true);
              }}
            >
              <Card className="glass-card border-border/50 cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={salon.logo || undefined} />
                      <AvatarFallback>{salon.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{salon.name}</p>
                        <Badge
                          className={
                            salon.status === 'approved'
                              ? 'bg-success/20 text-success text-[10px]'
                              : salon.status === 'suspended'
                              ? 'bg-destructive/20 text-destructive text-[10px]'
                              : salon.status === 'rejected'
                              ? 'bg-destructive/20 text-destructive text-[10px]'
                              : 'bg-warning/20 text-warning text-[10px]'
                          }
                        >
                          {salon.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{salon.city}</span>
                        <span>•</span>
                        <span>{salon.commission_rate || 15}% commission</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No salons found</p>
          </div>
        )}
      </div>

      {/* Salons Table - Desktop */}
      <Card className="glass-card border-border/50 hidden lg:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSalons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Salon</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalons.map((salon) => (
                  <TableRow 
                    key={salon.id} 
                    className="border-border/50 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedSalon(salon);
                      setDetailSheetOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={salon.logo || undefined} />
                          <AvatarFallback>{salon.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{salon.name}</p>
                          {salon.phone && (
                            <p className="text-xs text-muted-foreground">{salon.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{salon.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          salon.status === 'approved'
                            ? 'bg-success/20 text-success'
                            : salon.status === 'suspended'
                            ? 'bg-destructive/20 text-destructive'
                            : salon.status === 'rejected'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-warning/20 text-warning'
                        }
                      >
                        {salon.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span>{salon.rating || '0.0'}</span>
                        <span className="text-xs text-muted-foreground">
                          ({salon.review_count || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 text-primary">
                        {salon.commission_rate || 15}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-border/50">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSalon(salon);
                            setDetailSheetOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleAction('commission', salon.id);
                          }}>
                            <Percent className="h-4 w-4 mr-2" />
                            Update Commission
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {salon.status === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                className="text-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('approve', salon.id);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('reject', salon.id);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {salon.status === 'approved' && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('suspend', salon.id);
                              }}
                            >
                              <Snowflake className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {salon.status === 'suspended' && (
                            <DropdownMenuItem 
                              className="text-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('reactivate', salon.id);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No salons found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <SalonDetailSheet
        salon={selectedSalon}
        isOpen={detailSheetOpen}
        onClose={() => {
          setDetailSheetOpen(false);
          setSelectedSalon(null);
        }}
        onAction={handleAction}
      />

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
