import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Store, Users, DollarSign, MessageSquare,
  Activity, Settings, LogOut, Shield, Wallet, CreditCard, BarChart3,
  Calendar, Scissors, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  profile: { full_name: string | null; avatar_url: string | null } | null;
  onSignOut: () => void;
  pendingTickets?: number;
  pendingPayouts?: number;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard', badge: null },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', badge: null },
  { icon: Calendar, label: 'Bookings', path: '/admin/bookings', badge: null },
  { icon: Store, label: 'Salons', path: '/admin/salons', badge: null },
  { icon: Scissors, label: 'Categories', path: '/admin/categories', badge: null },
  { icon: Users, label: 'Users', path: '/admin/users', badge: null },
  { icon: Star, label: 'Reviews', path: '/admin/reviews', badge: null },
  { icon: Wallet, label: 'Wallets', path: '/admin/wallets', badge: null },
  { icon: MessageSquare, label: 'Support', path: '/admin/support', badge: 'pendingTickets' },
  { icon: CreditCard, label: 'Payouts', path: '/admin/payouts', badge: 'pendingPayouts' },
  { icon: DollarSign, label: 'Financials', path: '/admin/financials', badge: null },
  { icon: Activity, label: 'Activity Logs', path: '/admin/logs', badge: null },
  { icon: Settings, label: 'Settings', path: '/admin/settings', badge: null },
];

export const AdminSidebar = ({ profile, onSignOut, pendingTickets = 0, pendingPayouts = 0 }: AdminSidebarProps) => {
  const location = useLocation();
  const badges = { pendingTickets, pendingPayouts };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass-card border-r border-border/50 p-6 hidden lg:flex flex-col z-50">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-serif text-xl font-semibold gradient-text">Glamour</span>
          <Badge variant="secondary" className="ml-2 text-xs bg-destructive/20 text-destructive">
            Admin
          </Badge>
        </div>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : 0;

          return (
            <Link key={item.path} to={item.path}>
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-primary/20 text-primary shadow-glow-rose"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs animate-pulse">
                    {badgeCount}
                  </Badge>
                )}
              </motion.button>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.full_name?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-sm text-muted-foreground">Super Admin</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
