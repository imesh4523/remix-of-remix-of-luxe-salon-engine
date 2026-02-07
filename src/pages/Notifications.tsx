import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import MobileNav from '@/components/MobileNav';
import { useNotificationPreferences, type NotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushSubscription } from '@/hooks/usePushSubscription';

const Notifications = () => {
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();
  const { isSubscribed, isPushSupported, permissionState, subscribeToPush, unsubscribeFromPush, isLoading: pushLoading } = usePushSubscription();

  const emailToggles: { key: keyof NotificationPreferences; icon: typeof Bell; title: string; description: string }[] = [
    { key: 'email_booking_confirm', icon: Bell, title: 'Booking Confirmations', description: 'Email when a booking is confirmed' },
    { key: 'email_booking_reminder', icon: Bell, title: 'Booking Reminders', description: 'Email reminder 24h before appointment' },
    { key: 'email_booking_complete', icon: Bell, title: 'Booking Completed', description: 'Email when service is completed' },
    { key: 'email_booking_cancelled', icon: Bell, title: 'Booking Cancellations', description: 'Email when a booking is cancelled' },
    { key: 'email_payment_received', icon: Bell, title: 'Payment Receipts', description: 'Email when payment is received' },
    { key: 'email_promotions', icon: MessageSquare, title: 'Promotions & Offers', description: 'Receive special deals from salons' },
  ];

  const pushToggles: { key: keyof NotificationPreferences; title: string; description: string }[] = [
    { key: 'push_booking_updates', title: 'Booking Updates', description: 'New, confirmed & cancelled bookings' },
    { key: 'push_reminders', title: 'Reminders', description: 'Appointment reminders' },
    { key: 'push_payment_updates', title: 'Payment Updates', description: 'Payment & payout notifications' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 glass-card border-b border-border/50 pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Push Notifications */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Push Notifications</h2>
            </div>

            {!isPushSupported ? (
              <p className="text-sm text-muted-foreground">Push notifications are not supported on this device/browser.</p>
            ) : (
              <>
                {/* Permission status */}
                <div className="flex items-center gap-2 text-sm">
                  {permissionState === 'granted' ? (
                    <><ShieldCheck className="h-4 w-4 text-green-500" /><span className="text-muted-foreground">Permission granted</span></>
                  ) : permissionState === 'denied' ? (
                    <><ShieldOff className="h-4 w-4 text-destructive" /><span className="text-muted-foreground">Permission denied — enable in browser settings</span></>
                  ) : (
                    <span className="text-muted-foreground">Permission not yet requested</span>
                  )}
                </div>

                {/* Subscribe/Unsubscribe button */}
                <Button
                  variant={isSubscribed ? 'outline' : 'default'}
                  className="w-full"
                  disabled={pushLoading || permissionState === 'denied'}
                  onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                >
                  {pushLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
                </Button>

                {/* Granular push toggles - only show when subscribed */}
                {isSubscribed && (
                  <div className="space-y-4 pt-2">
                    {pushToggles.map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={item.key} className="font-medium cursor-pointer">{item.title}</Label>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch
                          id={item.key}
                          checked={preferences[item.key] as boolean}
                          onCheckedChange={(val) => updatePreference(item.key, val)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Email Notifications */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Email Notifications</h2>
            </div>
            {emailToggles.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">{item.title}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={preferences[item.key] as boolean}
                  onCheckedChange={(val) => updatePreference(item.key, val)}
                />
              </div>
            ))}
          </div>

          {/* SMS */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">SMS Notifications</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms_enabled" className="font-medium cursor-pointer">Enable SMS</Label>
                <p className="text-sm text-muted-foreground">Receive text message notifications</p>
              </div>
              <Switch
                id="sms_enabled"
                checked={preferences.sms_enabled}
                onCheckedChange={(val) => updatePreference('sms_enabled', val)}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Notifications;
