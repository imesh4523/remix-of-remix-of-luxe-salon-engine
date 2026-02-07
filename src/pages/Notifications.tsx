import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import MobileNav from '@/components/MobileNav';

const Notifications = () => {
  const [settings, setSettings] = useState({
    bookingReminders: true,
    promotions: false,
    newSalons: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  const notificationTypes = [
    {
      key: 'bookingReminders' as const,
      icon: Bell,
      title: 'Booking Reminders',
      description: 'Get reminded before your appointments',
    },
    {
      key: 'promotions' as const,
      icon: MessageSquare,
      title: 'Promotions & Offers',
      description: 'Receive special deals from salons',
    },
    {
      key: 'newSalons' as const,
      icon: Bell,
      title: 'New Salons',
      description: 'Get notified when new salons join',
    },
  ];

  const channels = [
    {
      key: 'emailNotifications' as const,
      icon: Mail,
      title: 'Email',
      description: 'Receive notifications via email',
    },
    {
      key: 'pushNotifications' as const,
      icon: Smartphone,
      title: 'Push Notifications',
      description: 'Receive push notifications on device',
    },
    {
      key: 'smsNotifications' as const,
      icon: MessageSquare,
      title: 'SMS',
      description: 'Receive text message notifications',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/50 pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Notification Types */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-lg">Notification Types</h2>
            {notificationTypes.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={settings[item.key]}
                  onCheckedChange={() => handleToggle(item.key)}
                />
              </div>
            ))}
          </div>

          {/* Channels */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-lg">Notification Channels</h2>
            {channels.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={settings[item.key]}
                  onCheckedChange={() => handleToggle(item.key)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Notifications;
