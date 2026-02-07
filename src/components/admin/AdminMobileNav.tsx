import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Store, Users, DollarSign, Settings,
  MessageSquare, Activity, MoreHorizontal, Wallet, CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AdminMobileNavProps {
  pendingTickets?: number;
  pendingPayouts?: number;
}

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/admin/dashboard' },
  { icon: Store, label: 'Salons', path: '/admin/salons' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: DollarSign, label: 'Finance', path: '/admin/financials' },
];

const moreNavItems = [
  { icon: MessageSquare, label: 'Support Tickets', path: '/admin/support', badge: 'pendingTickets' },
  { icon: CreditCard, label: 'Payout Requests', path: '/admin/payouts', badge: 'pendingPayouts' },
  { icon: Wallet, label: 'Wallets', path: '/admin/wallets' },
  { icon: Activity, label: 'Activity Logs', path: '/admin/logs' },
  { icon: Settings, label: 'System Settings', path: '/admin/settings' },
];

export const AdminMobileNav = ({ pendingTickets = 0, pendingPayouts = 0 }: AdminMobileNavProps) => {
  const location = useLocation();
  const badges = { pendingTickets, pendingPayouts };

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreNavItems.some(item => location.pathname.startsWith(item.path));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className="text-[10px] mt-1 font-medium truncate">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative",
                isMoreActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">More</span>
              {(pendingTickets > 0 || pendingPayouts > 0) && (
                <span className="absolute top-1 right-1/4 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="glass-card border-t border-border/50 rounded-t-3xl pb-safe">
            <SheetHeader className="pb-4">
              <SheetTitle className="font-serif text-lg">More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 pb-4">
              {moreNavItems.map((item) => {
                const active = location.pathname.startsWith(item.path);
                const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : 0;

                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl transition-all relative",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                      {badgeCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground animate-pulse"
                        >
                          {badgeCount}
                        </Badge>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
