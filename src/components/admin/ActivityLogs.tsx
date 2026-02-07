import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, Filter, User, Store, Wallet, Calendar,
  Settings, Shield, RefreshCw, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLogs, useRealtimeActivityLogs, ActivityLog } from '@/hooks/useAdminData';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const entityIcons: Record<string, typeof User> = {
  user: User,
  salon: Store,
  wallet: Wallet,
  booking: Calendar,
  settings: Settings,
  admin: Shield,
};

const actionColors: Record<string, string> = {
  create: 'bg-success/20 text-success',
  update: 'bg-info/20 text-info',
  delete: 'bg-destructive/20 text-destructive',
  login: 'bg-primary/20 text-primary',
  logout: 'bg-muted text-muted-foreground',
  approve: 'bg-success/20 text-success',
  reject: 'bg-destructive/20 text-destructive',
  freeze: 'bg-warning/20 text-warning',
  unfreeze: 'bg-success/20 text-success',
  payout: 'bg-accent/20 text-accent',
};

export const ActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs, isLoading, refetch } = useActivityLogs(100);
  
  // Subscribe to realtime updates
  useRealtimeActivityLogs();

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const filteredLogs = logs?.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionType = (action: string): string => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) return 'create';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'update';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'delete';
    if (actionLower.includes('login') || actionLower.includes('sign in')) return 'login';
    if (actionLower.includes('logout') || actionLower.includes('sign out')) return 'logout';
    if (actionLower.includes('approve')) return 'approve';
    if (actionLower.includes('reject')) return 'reject';
    if (actionLower.includes('freeze')) return 'freeze';
    if (actionLower.includes('unfreeze')) return 'unfreeze';
    if (actionLower.includes('payout')) return 'payout';
    return 'update';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Activity Logs
          </h2>
          <p className="text-muted-foreground">
            Real-time system activity monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-muted/50"
            />
          </div>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
        </div>
      </div>

      {/* Logs Timeline */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </span>
            <Badge variant="secondary">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border/50" />

                <AnimatePresence>
                  {filteredLogs.map((log, index) => {
                    const Icon = entityIcons[log.entity_type.toLowerCase()] || Activity;
                    const actionType = getActionType(log.action);
                    const colorClass = actionColors[actionType] || 'bg-muted text-muted-foreground';

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="relative pl-12 pb-6"
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute left-3 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background",
                          colorClass
                        )}>
                          <Icon className="h-3 w-3" />
                        </div>

                        {/* Log content */}
                        <div className="glass-card-elevated p-4 rounded-xl border border-border/30">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn("text-xs", colorClass)}>
                                  {log.action}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {log.entity_type}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm">
                                {log.details ? (
                                  <span className="text-muted-foreground">
                                    {JSON.stringify(log.details).slice(0, 100)}
                                    {JSON.stringify(log.details).length > 100 && '...'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">No additional details</span>
                                )}
                              </p>
                              {log.entity_id && (
                                <p className="mt-1 text-xs text-muted-foreground font-mono">
                                  ID: {log.entity_id.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(log.created_at), 'MMM d, h:mm:ss a')}
                              </p>
                              {log.ip_address && (
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                  {log.ip_address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity logs found</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
