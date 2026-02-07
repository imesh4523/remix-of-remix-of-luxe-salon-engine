import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, DollarSign, Users, Scissors, TrendingUp, Clock,
  Plus, Settings, LogOut, Bell, ChevronRight, MoreVertical, ArrowLeft,
  Eye, EyeOff, BarChart3, PieChart, UserPlus, Trash2
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMySalon, useSalonBookings, useStaff, useServices, useUpdateBookingStatus } from '@/hooks/useData';
import {
  useStaffShifts,
  useCreateStaffShift,
  useDeleteStaffShift,
  useRevenueAnalytics,
  useServicePopularity,
  useMonthlySummary,
  useUpdateSalonVisibility,
  useCreateStaff,
  useCreateService,
  useSalonCompletionRate,
} from '@/hooks/useVendorData';
import { useVendorWallet } from '@/hooks/useVendorFinancials';
import { CompletionRateCard } from '@/components/CompletionRateCard';
import { SalonSettingsForm } from '@/components/vendor/SalonSettingsForm';
import { PlatformPayableCard } from '@/components/vendor/PlatformPayableCard';
import { mockBookings, mockStaff } from '@/lib/mock-data';
import { BookingCard } from '@/components/BookingCard';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

const VendorDashboard = () => {
  const { user, profile, signOut, isVendor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState('');
  const [shiftDate, setShiftDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');

  const { data: salon, isLoading: salonLoading } = useMySalon(user?.id);
  const { data: bookings, isLoading: bookingsLoading } = useSalonBookings(salon?.id);
  const { data: staff, isLoading: staffLoading } = useStaff(salon?.id);
  const { data: services, isLoading: servicesLoading } = useServices(salon?.id);
  const { data: shifts } = useStaffShifts(salon?.id);
  const { data: revenueData } = useRevenueAnalytics(salon?.id);
  const { data: servicePopularity } = useServicePopularity(salon?.id);
  const { data: monthlySummary } = useMonthlySummary(salon?.id);
  const { data: completionRate } = useSalonCompletionRate(salon?.id);
  const { data: vendorWallet } = useVendorWallet(user?.id, salon?.id);
  
  const updateBookingStatus = useUpdateBookingStatus();
  const updateVisibility = useUpdateSalonVisibility();
  const createStaff = useCreateStaff();
  const createShift = useCreateStaffShift();
  const deleteShift = useDeleteStaffShift();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleToggleVisibility = async () => {
    if (!salon) return;
    await updateVisibility.mutateAsync({
      salonId: salon.id,
      status: salon.status === 'approved' ? 'suspended' : 'approved',
    });
  };

  const handleAddStaff = async () => {
    if (!salon || !newStaffName) return;
    await createStaff.mutateAsync({
      salon_id: salon.id,
      name: newStaffName,
      title: newStaffTitle || undefined,
    });
    setNewStaffName('');
    setNewStaffTitle('');
    setStaffDialogOpen(false);
  };

  const handleAddShift = async () => {
    if (!selectedStaffForShift || !shiftDate) return;
    await createShift.mutateAsync({
      staff_id: selectedStaffForShift,
      date: shiftDate,
      start_time: shiftStart,
      end_time: shiftEnd,
    });
    setShiftDialogOpen(false);
  };

  // Calculate stats from real data
  const todaysBookings = bookings?.filter(
    (b) => b.booking_date === format(selectedDate, 'yyyy-MM-dd')
  ) || [];

  const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
  const todayRevenue = todaysBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const stats = [
    {
      title: "Today's Revenue",
      value: `Rs. ${todayRevenue.toLocaleString()}`,
      change: monthlySummary?.revenueChange ? `${monthlySummary.revenueChange > 0 ? '+' : ''}${monthlySummary.revenueChange}%` : '+0%',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: "Today's Appointments",
      value: todaysBookings.length.toString(),
      change: 'scheduled',
      icon: Calendar,
      color: 'text-primary',
    },
    {
      title: 'Active Staff',
      value: staff?.length?.toString() || '0',
      change: 'Online',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Pending Requests',
      value: bookings?.filter(b => b.status === 'pending').length.toString() || '0',
      change: 'New',
      icon: Bell,
      color: 'text-accent',
    },
  ];

  const displayBookings = bookings && bookings.length > 0 ? bookings : mockBookings;
  const displayStaff = staff && staff.length > 0 ? staff : mockStaff;

  // Chart colors
  const CHART_COLORS = ['hsl(15, 60%, 65%)', 'hsl(38, 70%, 55%)', 'hsl(200, 70%, 55%)', 'hsl(145, 60%, 45%)', 'hsl(350, 60%, 55%)'];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass-card border-r border-border/50 p-6 hidden lg:flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-xl font-serif font-bold text-primary-foreground">G</span>
          </div>
          <span className="font-serif text-xl font-semibold gradient-text">Glamour</span>
        </Link>

        {/* Store Visibility Toggle */}
        {salon && (
          <div className="mb-6 p-4 glass-card-elevated rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {salon.status === 'approved' ? (
                  <Eye className="h-4 w-4 text-success" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {salon.status === 'approved' ? 'Online' : 'Offline'}
                </span>
              </div>
              <Switch
                checked={salon.status === 'approved'}
                onCheckedChange={handleToggleVisibility}
                disabled={updateVisibility.isPending}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-2">
          {[
            { icon: Calendar, label: 'Overview', tab: 'overview' },
            { icon: Scissors, label: 'Services', tab: 'services', count: services?.length },
            { icon: Users, label: 'Staff', tab: 'staff', count: staff?.length },
            { icon: BarChart3, label: 'Analytics', tab: 'analytics' },
            { icon: DollarSign, label: 'Earnings', tab: 'earnings' },
            { icon: Settings, label: 'Settings', tab: 'settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.tab
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {item.count !== undefined && (
                <Badge variant="secondary" className="ml-auto">
                  {item.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={salon?.logo || profile?.avatar_url || undefined} />
              <AvatarFallback>{salon?.name?.[0] || profile?.full_name?.[0] || 'V'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{salon?.name || 'My Salon'}</p>
              <p className="text-sm text-muted-foreground">Vendor Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 glass-card border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Dashboard</h1>
          </div>
          {salon && (
            <Badge className={salon.status === 'approved' ? 'bg-success/20 text-success' : 'bg-muted'}>
              {salon.status === 'approved' ? 'Online' : 'Offline'}
            </Badge>
          )}
        </div>
        
        {/* Mobile Tab Navigation */}
        <div className="mt-4 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2">
            {['overview', 'staff', 'analytics', 'earnings'].map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant={activeTab === tab ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab)}
                className="capitalize shrink-0"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                  Hello, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Vendor'}</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">
                  {salon ? `Managing ${salon.name}` : "Here's what's happening today"}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {(bookings?.filter(b => b.status === 'pending').length || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center">
                      {bookings?.filter(b => b.status === 'pending').length}
                    </span>
                  )}
                </Button>
                <Button className="gap-2 shadow-glow-rose text-sm sm:text-base" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Booking</span>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card border-border/50">
                    <CardContent className="p-3 sm:p-6">
                      {salonLoading || bookingsLoading ? (
                        <Skeleton className="h-16 sm:h-20 w-full" />
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                            <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{stat.value}</p>
                            <Badge variant="secondary" className={`mt-1 sm:mt-2 text-xs ${stat.color}`}>
                              {stat.change}
                            </Badge>
                          </div>
                          <div className={`hidden sm:flex w-12 h-12 rounded-xl bg-muted/50 items-center justify-center ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Completion Rate Card */}
            {completionRate && (
              <div className="mb-6 sm:mb-8">
                <CompletionRateCard
                  rate={completionRate.rate}
                  completed={completionRate.completed}
                  total={completionRate.total}
                  previousRate={completionRate.previousRate}
                />
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Today's Appointments */}
              <div className="lg:col-span-2">
                <Card className="glass-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <CardTitle className="font-serif text-lg sm:text-xl">Today's Bookings</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                      View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                    {bookingsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : displayBookings.length > 0 ? (
                      displayBookings.slice(0, 5).map((booking) => (
                        <BookingCard key={booking.id} booking={booking} showActions />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No appointments today</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Staff on Duty */}
              <div className="space-y-6">
                <Card className="glass-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif">Staff on Duty</CardTitle>
                    <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-border/50">
                        <DialogHeader>
                          <DialogTitle className="font-serif">Add Staff Member</DialogTitle>
                          <DialogDescription>Add a new team member to your salon.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              placeholder="Staff name"
                              value={newStaffName}
                              onChange={(e) => setNewStaffName(e.target.value)}
                              className="bg-muted/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              placeholder="e.g., Senior Stylist"
                              value={newStaffTitle}
                              onChange={(e) => setNewStaffTitle(e.target.value)}
                              className="bg-muted/50"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddStaff} disabled={!newStaffName || createStaff.isPending}>
                            {createStaff.isPending ? 'Adding...' : 'Add Staff'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {staffLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : displayStaff.length > 0 ? (
                      displayStaff.map((staffMember) => (
                        <div
                          key={staffMember.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={staffMember.avatar_url || undefined} />
                              <AvatarFallback>{staffMember.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{staffMember.name}</p>
                            <p className="text-sm text-muted-foreground">{staffMember.title}</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No staff added yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Summary */}
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif">This Month</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="font-semibold">
                            Rs. {monthlySummary?.thisMonthRevenue?.toLocaleString() || completedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${monthlySummary?.revenueChange && monthlySummary.revenueChange > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {monthlySummary?.revenueChange ? `${monthlySummary.revenueChange > 0 ? '+' : ''}${monthlySummary.revenueChange}%` : '+0%'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bookings</p>
                          <p className="font-semibold">{monthlySummary?.thisMonthBookings || bookings?.length || 0}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary">
                        {monthlySummary?.thisMonthCompleted || 0} completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">Staff Management</h2>
                <p className="text-muted-foreground">Manage your team and shifts</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Add Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-border/50">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Schedule Shift</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <Select value={selectedStaffForShift} onValueChange={setSelectedStaffForShift}>
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff?.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={shiftDate}
                          onChange={(e) => setShiftDate(e.target.value)}
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={shiftStart}
                            onChange={(e) => setShiftStart(e.target.value)}
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={shiftEnd}
                            onChange={(e) => setShiftEnd(e.target.value)}
                            className="bg-muted/50"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddShift} disabled={!selectedStaffForShift || createShift.isPending}>
                        {createShift.isPending ? 'Adding...' : 'Add Shift'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-glow-rose">
                      <UserPlus className="h-4 w-4" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Staff List */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif">Team Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {displayStaff.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.title || 'Team Member'}</p>
                      </div>
                      <Badge className="bg-success/20 text-success">Active</Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Shifts */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif">Upcoming Shifts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shifts && shifts.length > 0 ? (
                    shifts.slice(0, 5).map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{shift.staff?.name?.[0] || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{shift.staff?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(shift.date), 'MMM d')} • {shift.start_time} - {shift.end_time}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteShift.mutate(shift.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No shifts scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">Insights into your salon performance</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData && revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(15, 60%, 65%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(15, 60%, 65%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 20%)" />
                        <XAxis dataKey="date" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(220, 15%, 12%)',
                            border: '1px solid hsl(220, 10%, 20%)',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(15, 60%, 65%)"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No revenue data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Popularity */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    Popular Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicePopularity && servicePopularity.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="50%" height={200}>
                        <RechartsPie>
                          <Pie
                            data={servicePopularity}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="name"
                          >
                            {servicePopularity.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {servicePopularity.slice(0, 5).map((service, index) => (
                          <div key={service.name} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm truncate flex-1">{service.name}</span>
                            <span className="text-xs text-muted-foreground">{service.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No service data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold">Earnings</h2>
              <p className="text-muted-foreground">Track your revenue, commissions, and payouts</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">
                        Rs. {completedBookings.reduce((sum, b) => sum + Number(b.vendor_payout), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">
                        Rs. {bookings?.filter(b => b.status === 'pending').reduce((sum, b) => sum + Number(b.vendor_payout), 0).toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">
                        Rs. {monthlySummary?.thisMonthRevenue?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Payable Card - Commission Tracking */}
            {salon && (
              <PlatformPayableCard 
                salonId={salon.id} 
                walletBalance={vendorWallet?.wallet?.balance || 0} 
              />
            )}

            {/* Request Payout Section */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif">Request Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-sm text-muted-foreground">Wallet Balance</p>
                      <p className="text-xl font-bold">
                        Rs. {(vendorWallet?.wallet?.balance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                      <p className="text-sm text-success">Available for Payout</p>
                      <p className="text-xl font-bold text-success">
                        Rs. {(vendorWallet?.availableForPayout || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Payouts are processed weekly. Platform commission from cash bookings will be deducted from your payout.
                    </p>
                    <Button 
                      className="gap-2 shadow-glow-rose"
                      disabled={(vendorWallet?.availableForPayout || 0) <= 0}
                    >
                      Request Payout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && salon && (
          <SalonSettingsForm 
            salon={salon}
            staffCount={staff?.length || 0}
            servicesCount={services?.length || 0}
          />
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
