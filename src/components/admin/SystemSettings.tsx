import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Settings, CreditCard, Mail, Bell, Shield, Save, Eye, EyeOff,
  CheckCircle, AlertTriangle, Loader2, RefreshCw, Globe, Percent,
  Clock, Users, Store, Smartphone, Database, Server, Bitcoin, Snowflake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreditLimitSettings } from './CreditLimitSettings';
import { CryptoCurrencySelector } from './CryptoCurrencySelector';

interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  is_secret: boolean;
  category: string;
  description: string | null;
}

const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
};

const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};

const SettingInput = ({ 
  setting, 
  value, 
  onChange,
  onSave,
  isSaving 
}: { 
  setting: SystemSetting;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const isModified = value !== (setting.value || '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={setting.key} className="text-sm font-medium">
          {setting.description || setting.key}
        </Label>
        {setting.is_secret && (
          <Badge variant="secondary" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Secret
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={setting.key}
            type={setting.is_secret && !showSecret ? 'password' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.is_secret ? '••••••••' : `Enter ${setting.description?.toLowerCase()}`}
            className="bg-muted/50 pr-10"
          />
          {setting.is_secret && (
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {isModified && (
          <Button 
            size="sm" 
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const SettingSwitch = ({ 
  setting, 
  value, 
  onChange,
  onSaveWithValue,
  isSaving 
}: { 
  setting: SystemSetting;
  value: boolean;
  onChange: (value: boolean) => void;
  onSaveWithValue: (value: string) => void;
  isSaving: boolean;
}) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl">
      <div className="flex-1">
        <Label htmlFor={setting.key} className="text-sm font-medium">
          {setting.description || setting.key}
        </Label>
      </div>
      <Switch
        id={setting.key}
        checked={value}
        onCheckedChange={(checked) => {
          onChange(checked);
          // Save immediately with the new value directly
          onSaveWithValue(checked ? 'true' : 'false');
        }}
        disabled={isSaving}
      />
    </div>
  );
};

const SettingNumber = ({ 
  setting, 
  value, 
  onChange,
  onSave,
  isSaving,
  suffix = ''
}: { 
  setting: SystemSetting;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  suffix?: string;
}) => {
  const isModified = value !== (setting.value || '');

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl">
      <div className="flex-1">
        <Label htmlFor={setting.key} className="text-sm font-medium">
          {setting.description || setting.key}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={setting.key}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-8 text-center bg-muted/50"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        {isModified && (
          <Button 
            size="sm" 
            onClick={onSave}
            disabled={isSaving}
            className="h-8"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export const SystemSettings = () => {
  const { data: settings, isLoading, refetch } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => {
    if (settings) {
      const values: Record<string, string> = {};
      settings.forEach(s => {
        values[s.key] = s.value || '';
      });
      setLocalValues(values);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await updateSetting.mutateAsync({ key, value: localValues[key] });
      toast.success('Setting saved successfully');
    } catch (error) {
      toast.error('Failed to save setting');
    }
    setSavingKey(null);
  };

  // Save with specific value (for switches that need immediate save)
  const handleSaveWithValue = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await updateSetting.mutateAsync({ key, value });
      toast.success('Setting saved successfully');
    } catch (error) {
      toast.error('Failed to save setting');
    }
    setSavingKey(null);
  };

  const getSettingsByCategory = (category: string) => {
    return settings?.filter(s => s.category === category) || [];
  };

  const getBooleanValue = (key: string) => {
    return localValues[key] === 'true';
  };

  const renderSetting = (setting: SystemSetting, suffix?: string) => {
    const isBoolean = setting.value === 'true' || setting.value === 'false';
    const isNumber = !isNaN(Number(setting.value)) && !isBoolean && !setting.is_secret;

    if (isBoolean) {
      return (
        <SettingSwitch
          key={setting.key}
          setting={setting}
          value={getBooleanValue(setting.key)}
          onChange={(val) => setLocalValues(prev => ({ ...prev, [setting.key]: val ? 'true' : 'false' }))}
          onSaveWithValue={(val) => handleSaveWithValue(setting.key, val)}
          isSaving={savingKey === setting.key}
        />
      );
    }

    if (isNumber && suffix) {
      return (
        <SettingNumber
          key={setting.key}
          setting={setting}
          value={localValues[setting.key] || ''}
          onChange={(val) => setLocalValues(prev => ({ ...prev, [setting.key]: val }))}
          onSave={() => handleSave(setting.key)}
          isSaving={savingKey === setting.key}
          suffix={suffix}
        />
      );
    }

    return (
      <SettingInput
        key={setting.key}
        setting={setting}
        value={localValues[setting.key] || ''}
        onChange={(val) => setLocalValues(prev => ({ ...prev, [setting.key]: val }))}
        onSave={() => handleSave(setting.key)}
        isSaving={savingKey === setting.key}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings
          </h2>
          <p className="text-muted-foreground text-sm">
            Configure platform settings, API keys, and business rules
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile-friendly scrollable tabs */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="glass-card border border-border/50 inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="platform" className="gap-2 whitespace-nowrap">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Platform</span>
            </TabsTrigger>
            <TabsTrigger value="credit" className="gap-2 whitespace-nowrap">
              <Snowflake className="h-4 w-4" />
              <span className="hidden sm:inline">Credit Limits</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 whitespace-nowrap">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 whitespace-nowrap">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <div className="space-y-6">
            {/* General Settings */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic platform configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('platform')
                  .filter(s => ['platform_name', 'platform_tagline', 'support_email', 'support_phone'].includes(s.key))
                  .map(setting => renderSetting(setting))}
              </CardContent>
            </Card>

            {/* Business Rules */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5 text-primary" />
                  Business Rules
                </CardTitle>
                <CardDescription>
                  Configure booking and vendor settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'platform_commission_rate')
                  .map(setting => renderSetting(setting, '%'))}
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'min_payout_amount')
                  .map(setting => renderSetting(setting, 'Rs.'))}
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'booking_advance_days')
                  .map(setting => renderSetting(setting, 'days'))}
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'min_booking_notice_hours')
                  .map(setting => renderSetting(setting, 'hours'))}
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'cancellation_hours')
                  .map(setting => renderSetting(setting, 'hours'))}
                {getSettingsByCategory('platform')
                  .filter(s => s.key === 'max_booking_per_day')
                  .map(setting => renderSetting(setting, 'bookings'))}
              </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSettingsByCategory('platform')
                  .filter(s => ['maintenance_mode', 'allow_vendor_registration', 'vendor_auto_approve', 'require_email_verification'].includes(s.key))
                  .map(setting => renderSetting(setting))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Credit Limits Tab */}
        <TabsContent value="credit">
          <CreditLimitSettings />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Google OAuth Settings */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Sign-In
                </CardTitle>
                <CardDescription>
                  Configure Google OAuth for social login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('security')
                  .filter(s => s.key === 'google_oauth_enabled')
                  .map(setting => renderSetting(setting))}

                {getBooleanValue('google_oauth_enabled') && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    {getSettingsByCategory('security')
                      .filter(s => ['google_client_id', 'google_client_secret'].includes(s.key))
                      .map(setting => renderSetting(setting))}
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Lovable Cloud Managed</p>
                    <p className="text-muted-foreground mt-1">
                      By default, Lovable Cloud manages Google Sign-In. Add custom credentials for your own branding 
                      or leave empty to use managed credentials.
                    </p>
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      Get credentials from Google Cloud Console →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session & Security */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Session & Security
                </CardTitle>
                <CardDescription>
                  Manage session timeout and login security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('security')
                  .filter(s => !['google_oauth_enabled', 'google_client_id', 'google_client_secret'].includes(s.key))
                  .map((setting) => {
                    if (setting.key === 'max_login_attempts') {
                      return renderSetting(setting, 'attempts');
                    }
                    if (setting.key === 'session_timeout_hours') {
                      return renderSetting(setting, 'hours');
                    }
                    return renderSetting(setting);
                  })}

                <Separator className="my-4" />

                <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Security Notice</p>
                    <p className="text-muted-foreground mt-1">
                      Disabling email confirmation or reducing security settings may expose your platform to risks. 
                      Enable these for production use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Payment Gateway Selection */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Gateway
                </CardTitle>
                <CardDescription>
                  Configure your payment processing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Payment Gateway</Label>
                  <Select
                    value={localValues['payment_gateway'] || 'payhere'}
                    onValueChange={(val) => {
                      setLocalValues(prev => ({ ...prev, payment_gateway: val }));
                      handleSave('payment_gateway');
                    }}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payhere">PayHere (Sri Lanka)</SelectItem>
                      <SelectItem value="stripe">Stripe (International)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {getSettingsByCategory('payment')
                  .filter(s => ['enable_online_payments', 'enable_cash_payments'].includes(s.key))
                  .map(setting => renderSetting(setting))}
              </CardContent>
            </Card>

            {/* PayHere Settings */}
            {localValues['payment_gateway'] === 'payhere' && (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">PayHere Configuration</CardTitle>
                  <CardDescription>Enter your PayHere merchant credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getSettingsByCategory('payment')
                    .filter(s => ['payhere_merchant_id', 'payhere_merchant_secret', 'payhere_sandbox_mode'].includes(s.key))
                    .map(setting => renderSetting(setting))}
                </CardContent>
              </Card>
            )}

            {/* Stripe Settings */}
            {localValues['payment_gateway'] === 'stripe' && (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Stripe Configuration</CardTitle>
                  <CardDescription>Enter your Stripe API credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getSettingsByCategory('payment')
                    .filter(s => ['stripe_publishable_key', 'stripe_secret_key'].includes(s.key))
                    .map(setting => renderSetting(setting))}
                </CardContent>
              </Card>
            )}

            {/* NOWPayments Crypto Settings */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Bitcoin className="h-5 w-5 text-primary" />
                  NOWPayments (Crypto)
                </CardTitle>
                <CardDescription>
                  Accept Bitcoin, Ethereum, USDT and 300+ cryptocurrencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('payment')
                  .filter(s => s.key === 'nowpayments_enabled')
                  .map(setting => renderSetting(setting))}

                {getBooleanValue('nowpayments_enabled') && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    {getSettingsByCategory('payment')
                      .filter(s => ['nowpayments_api_key', 'nowpayments_ipn_secret'].includes(s.key))
                      .map(setting => renderSetting(setting))}

                    {getSettingsByCategory('payment')
                      .filter(s => s.key === 'nowpayments_sandbox')
                      .map(setting => renderSetting(setting))}

                    {/* Crypto Currency Selection */}
                    <CryptoCurrencySelector
                      selectedCurrencies={localValues['nowpayments_currencies'] || 'btc,eth,usdttrc20'}
                      onChange={(currencies) => {
                        setLocalValues(prev => ({ ...prev, nowpayments_currencies: currencies }));
                        handleSaveWithValue('nowpayments_currencies', currencies);
                      }}
                      isSaving={savingKey === 'nowpayments_currencies'}
                    />
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <Bitcoin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Crypto Payments</p>
                    <p className="text-muted-foreground mt-1">
                      Accept payments in Bitcoin, Ethereum, USDT, and 300+ other cryptocurrencies. 
                      No redirects - customers pay directly on your site.
                    </p>
                    <a 
                      href="https://account.nowpayments.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      Get API key from NOWPayments →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP or Resend for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Provider Selection */}
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select
                  value={localValues['email_provider'] || 'smtp'}
                  onValueChange={(val) => {
                    setLocalValues(prev => ({ ...prev, email_provider: val }));
                    handleSave('email_provider');
                  }}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="resend">Resend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Common Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Sender Information</h4>
                {getSettingsByCategory('email')
                  .filter(s => ['smtp_from_email', 'smtp_from_name'].includes(s.key))
                  .map(setting => renderSetting(setting))}
              </div>

              <Separator />

              {localValues['email_provider'] === 'resend' ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Resend Configuration</h4>
                  {getSettingsByCategory('email')
                    .filter(s => s.key === 'resend_api_key')
                    .map(setting => renderSetting(setting))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">SMTP Server Configuration</h4>
                  {getSettingsByCategory('email')
                    .filter(s => ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password'].includes(s.key))
                    .map(setting => renderSetting(setting))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email notifications for various events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('notifications')
                .filter(s => s.key !== 'reminder_hours_before')
                .map(setting => renderSetting(setting))}
              
              <Separator className="my-4" />
              
              {getSettingsByCategory('notifications')
                .filter(s => s.key === 'reminder_hours_before')
                .map(setting => renderSetting(setting, 'hours before'))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
