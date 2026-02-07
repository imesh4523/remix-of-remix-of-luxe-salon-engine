import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Shield, TrendingUp, AlertTriangle, Store, Snowflake,
  Save, Loader2, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

interface CreditSettings {
  auto_freeze_enabled: boolean;
  default_credit_limit_new: number;
  default_credit_limit_standard: number;
  default_credit_limit_trusted: number;
  default_credit_limit_premium: number;
  default_order_settlement_limit: number;
}

const useCreditSettings = () => {
  return useQuery({
    queryKey: ['credit_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'auto_freeze_enabled',
          'default_credit_limit_new',
          'default_credit_limit_standard',
          'default_credit_limit_trusted',
          'default_credit_limit_premium',
          'default_order_settlement_limit',
        ]);

      if (error) throw error;

      const settings: CreditSettings = {
        auto_freeze_enabled: true,
        default_credit_limit_new: 5000,
        default_credit_limit_standard: 10000,
        default_credit_limit_trusted: 25000,
        default_credit_limit_premium: 50000,
        default_order_settlement_limit: 0,
      };

      data.forEach((s) => {
        if (s.key === 'auto_freeze_enabled') {
          settings.auto_freeze_enabled = s.value === 'true';
        } else {
          (settings as any)[s.key] = parseInt(s.value || '0', 10);
        }
      });

      return settings;
    },
  });
};

const useSalonsNearLimit = () => {
  return useQuery({
    queryKey: ['salons_near_limit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('id, name, city, platform_payable, credit_limit, trust_level, status, auto_frozen_at, auto_freeze_reason')
        .eq('status', 'approved')
        .or('status.eq.suspended,auto_frozen_at.not.is.null')
        .order('platform_payable', { ascending: false });

      if (error) throw error;
      
      // Add frozen salons and calculate usage percentage
      const { data: frozenSalons, error: frozenError } = await supabase
        .from('salons')
        .select('id, name, city, platform_payable, credit_limit, trust_level, status, auto_frozen_at, auto_freeze_reason')
        .not('auto_frozen_at', 'is', null);

      if (frozenError) throw frozenError;

      // Merge and deduplicate
      const allSalons = [...(data || []), ...(frozenSalons || [])];
      const uniqueSalons = allSalons.filter((s, i, arr) => 
        arr.findIndex(x => x.id === s.id) === i
      );

      return uniqueSalons.map(s => ({
        ...s,
        platform_payable: Number(s.platform_payable) || 0,
        credit_limit: Number(s.credit_limit) || 10000,
        usage_percent: Math.min(100, ((Number(s.platform_payable) || 0) / (Number(s.credit_limit) || 10000)) * 100),
        is_frozen: !!s.auto_frozen_at,
      })).sort((a, b) => b.usage_percent - a.usage_percent);
    },
  });
};

const useUpdateCreditSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<CreditSettings>) => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Credit limit settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
};

export const CreditLimitSettings = () => {
  const { data: settings, isLoading: settingsLoading } = useCreditSettings();
  const { data: salonsNearLimit, isLoading: salonsLoading } = useSalonsNearLimit();
  const updateSettings = useUpdateCreditSettings();

  const [localSettings, setLocalSettings] = useState<Partial<CreditSettings>>({});

  const handleSave = async () => {
    if (Object.keys(localSettings).length === 0) return;
    await updateSettings.mutateAsync(localSettings);
    setLocalSettings({});
  };

  const getValue = (key: keyof CreditSettings) => {
    return localSettings[key] ?? settings?.[key];
  };

  const setValue = (key: keyof CreditSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const hasChanges = Object.keys(localSettings).length > 0;

  const frozenCount = salonsNearLimit?.filter(s => s.is_frozen).length || 0;
  const warningCount = salonsNearLimit?.filter(s => s.usage_percent >= 80 && !s.is_frozen).length || 0;

  const trustLevelConfig = [
    { key: 'default_credit_limit_new', label: 'New Salons', color: 'bg-muted', description: '< 30 days or < 20 orders' },
    { key: 'default_credit_limit_standard', label: 'Standard', color: 'bg-primary/20', description: 'Regular salons' },
    { key: 'default_credit_limit_trusted', label: 'Trusted', color: 'bg-success/20', description: '> 100 orders, > 3 months' },
    { key: 'default_credit_limit_premium', label: 'Premium', color: 'bg-accent/20', description: 'Top performers' },
  ];

  if (settingsLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Freeze Toggle */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auto-Freeze Protection
          </CardTitle>
          <CardDescription>
            Automatically suspend salons when they exceed their credit limit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Snowflake className={`h-5 w-5 ${getValue('auto_freeze_enabled') ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Enable Auto-Freeze</p>
                <p className="text-sm text-muted-foreground">
                  Salons will be suspended when platform_payable exceeds credit_limit
                </p>
              </div>
            </div>
            <Switch
              checked={getValue('auto_freeze_enabled') as boolean}
              onCheckedChange={(val) => setValue('auto_freeze_enabled', val)}
            />
          </div>

          {/* Order-based limit */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Order-Based Settlement</p>
                <p className="text-sm text-muted-foreground">
                  Require settlement every X orders (0 = disabled)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20 text-center bg-background"
                value={getValue('default_order_settlement_limit') as number}
                onChange={(e) => setValue('default_order_settlement_limit', parseInt(e.target.value) || 0)}
                min={0}
              />
              <span className="text-sm text-muted-foreground">orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Level Limits */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trust Level Credit Limits
          </CardTitle>
          <CardDescription>
            Set default credit limits for each trust level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustLevelConfig.map((level) => (
              <div
                key={level.key}
                className={`p-4 rounded-xl ${level.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{level.label}</p>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Max platform_payable before auto-freeze</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rs.</span>
                  <Input
                    type="number"
                    className="bg-background"
                    value={getValue(level.key as keyof CreditSettings) as number}
                    onChange={(e) => setValue(level.key as keyof CreditSettings, parseInt(e.target.value) || 0)}
                    min={0}
                    step={1000}
                  />
                </div>
              </div>
            ))}
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex justify-end"
            >
              <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Salons Near Limit */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Salons Approaching Limit
            {(frozenCount > 0 || warningCount > 0) && (
              <div className="flex gap-2 ml-2">
                {frozenCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <Snowflake className="h-3 w-3" />
                    {frozenCount} Frozen
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-warning/20 text-warning gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount} Warning
                  </Badge>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salonsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : salonsNearLimit && salonsNearLimit.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {salonsNearLimit.slice(0, 10).map((salon) => (
                <motion.div
                  key={salon.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl ${
                    salon.is_frozen
                      ? 'bg-destructive/10 border border-destructive/30'
                      : salon.usage_percent >= 80
                      ? 'bg-warning/10 border border-warning/30'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        salon.is_frozen ? 'bg-destructive/20' : 'bg-muted/50'
                      }`}>
                        {salon.is_frozen ? (
                          <Snowflake className="h-4 w-4 text-destructive" />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{salon.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{salon.city}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {salon.trust_level || 'new'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        salon.is_frozen ? 'text-destructive' : salon.usage_percent >= 80 ? 'text-warning' : ''
                      }`}>
                        {formatCurrency(salon.platform_payable)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(salon.credit_limit)} limit
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress
                      value={salon.usage_percent}
                      className={`h-2 ${
                        salon.is_frozen
                          ? '[&>div]:bg-destructive'
                          : salon.usage_percent >= 80
                          ? '[&>div]:bg-warning'
                          : salon.usage_percent >= 50
                          ? '[&>div]:bg-accent'
                          : ''
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(salon.usage_percent)}% used</span>
                      {salon.is_frozen && (
                        <span className="text-destructive font-medium">
                          Frozen: {salon.auto_freeze_reason?.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
              <p>All salons are within their limits</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
