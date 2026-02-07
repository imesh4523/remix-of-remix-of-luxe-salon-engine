import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Store, Users, DollarSign, AlertTriangle,
  TrendingUp, CheckCircle, XCircle, Clock, Search, ChevronRight,
  ArrowLeft, Activity, MessageSquare, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSalons, useUpdateSalonStatus, usePlatformStats } from '@/hooks/useData';
import { useSupportTickets, usePayoutRequests, useActivityLogs, useGlobalSearch } from '@/hooks/useAdminData';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { AdvancedUserManagement } from '@/components/admin/AdvancedUserManagement';
import { SupportTickets } from '@/components/admin/SupportTickets';
import { ActivityLogs } from '@/components/admin/ActivityLogs';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { SalonManagement } from '@/components/admin/SalonManagement';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { ReviewModeration } from '@/components/admin/ReviewModeration';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const AdminDashboard = () => {
  const { user, profile, signOut, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: salons, isLoading: salonsLoading } = useSalons();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: tickets } = useSupportTickets('open');
  const { data: payouts } = usePayoutRequests('pending');
  const { data: logs } = useActivityLogs(10);
  const { data: searchResults } = useGlobalSearch(searchTerm);
  const updateStatus = useUpdateSalonStatus();

  const handleApproveSalon = (salonId: string) => {
    updateStatus.mutate({ id: salonId, status: 'approved' });
  };

  const handleRejectSalon = (salonId: string) => {
    updateStatus.mutate({ id: salonId, status: 'rejected' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const pendingTickets = tickets?.length || 0;
  const pendingPayouts = payouts?.length || 0;

  const platformStats = [
    {
      title: 'Total Revenue',
      value: stats ? `Rs. ${stats.totalRevenue.toLocaleString()}` : 'Rs. 0',
      change: '+22%',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Active Salons',
      value: stats?.approvedSalons?.toString() || '0',
      change: `+${stats?.pendingSalons || 0} pending`,
      icon: Store,
      color: 'text-primary',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: 'All time',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Platform Earnings',
      value: `Rs. ${stats?.platformEarnings?.toLocaleString() || '0'}`,
      change: '15% avg commission',
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  // Determine which view to show based on path
  const currentPath = location.pathname;
  const isOverview = currentPath === '/admin' || currentPath === '/admin/dashboard';
  const isUsers = currentPath === '/admin/users';
  const isSupport = currentPath === '/admin/support';
  const isLogs = currentPath === '/admin/logs';
  const isSettings = currentPath === '/admin/settings';
  const isAnalytics = currentPath === '/admin/analytics';
  const isSalons = currentPath === '/admin/salons';
  const isBookings = currentPath === '/admin/bookings';
  const isCategories = currentPath === '/admin/categories';
  const isReviews = currentPath === '/admin/reviews';
  const isFinancials = currentPath === '/admin/financials' || currentPath === '/admin/payouts' || currentPath === '/admin/wallets';

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
      <AdminSidebar 
        profile={profile} 
        onSignOut={handleSignOut} 
        pendingTickets={pendingTickets}
        pendingPayouts={pendingPayouts}
      />

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 glass-card border-b border-border/50 p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-2 ml-auto">
            {pendingTickets > 0 && (
              <Badge className="bg-warning/20 text-warning">{pendingTickets} tickets</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Global Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users, salons, bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 glass-card border-border/50 text-base"
            />
            {searchTerm && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-border/50 rounded-xl p-4 z-50 max-h-80 overflow-y-auto">
                {searchResults.users.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">USERS</p>
                    {searchResults.users.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{u.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.salons.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">SALONS</p>
                    {searchResults.salons.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                        <Store className="h-5 w-5 text-primary" />
                        <span className="text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{s.city}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.users.length === 0 && searchResults.salons.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No results found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content based on route */}
        {isUsers && <AdvancedUserManagement />}
        {isSupport && <SupportTickets />}
        {isLogs && <ActivityLogs />}
        {isSettings && <SystemSettings />}
        {isAnalytics && <AnalyticsDashboard />}
        {isFinancials && <FinancialDashboard />}
        {isSalons && <SalonManagement />}
        {isBookings && <BookingManagement />}
        {isCategories && <CategoryManagement />}
        {isReviews && <ReviewModeration />}
        
        {isOverview && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                  Platform <span className="gradient-text">Overview</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Monitor and manage your marketplace
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {platformStats.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card border-border/50">
                    <CardContent className="p-3 sm:p-6">
                      {statsLoading ? (
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

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Salon Management */}
              <div className="lg:col-span-2">
                <Card className="glass-card border-border/50 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <CardTitle className="font-serif text-lg sm:text-xl">Salon Management</CardTitle>
                    <Link to="/admin/salons">
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-6 sm:pt-0">
                    {salonsLoading ? (
                      <div className="p-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : salons && salons.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border/50">
                              <TableHead>Salon</TableHead>
                              <TableHead className="hidden sm:table-cell">Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salons.slice(0, 5).map((salon) => (
                              <TableRow key={salon.id} className="border-border/50">
                                <TableCell className="py-2 sm:py-4">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                      <AvatarImage src={salon.logo || undefined} />
                                      <AvatarFallback>{salon.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{salon.name}</p>
                                      <p className="text-xs text-muted-foreground sm:hidden truncate">
                                        {salon.city}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground hidden sm:table-cell">
                                  {salon.city}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      salon.status === 'approved'
                                        ? 'bg-success/20 text-success'
                                        : salon.status === 'rejected'
                                        ? 'bg-destructive/20 text-destructive'
                                        : 'bg-warning/20 text-warning'
                                    }
                                  >
                                    {salon.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {salon.status === 'pending' && (
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-success hover:bg-success/10 h-8 w-8 p-0"
                                        onClick={() => handleApproveSalon(salon.id)}
                                        disabled={updateStatus.isPending}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                        onClick={() => handleRejectSalon(salon.id)}
                                        disabled={updateStatus.isPending}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No salons found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats Panel */}
              <div className="space-y-6">
                {/* Support Tickets */}
                <Card className="glass-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-warning" />
                      Open Tickets
                    </CardTitle>
                    <Badge className="bg-warning/20 text-warning">{pendingTickets}</Badge>
                  </CardHeader>
                  <CardContent>
                    {tickets && tickets.length > 0 ? (
                      <div className="space-y-3">
                        {tickets.slice(0, 3).map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-warning" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground capitalize">{ticket.priority}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                        <Link to="/admin/support">
                          <Button variant="ghost" className="w-full gap-2 mt-2">
                            View All Tickets <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No open tickets</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Log Preview */}
                <Card className="glass-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logs && logs.length > 0 ? (
                      <div className="space-y-3">
                        {logs.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm truncate">{log.action}</p>
                              <p className="text-xs text-muted-foreground">{log.entity_type}</p>
                            </div>
                          </div>
                        ))}
                        <Link to="/admin/logs">
                          <Button variant="ghost" className="w-full gap-2 mt-2">
                            View All Logs <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav 
        pendingTickets={pendingTickets}
        pendingPayouts={pendingPayouts}
      />
    </div>
  );
};

export default AdminDashboard;
