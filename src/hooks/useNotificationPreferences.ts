import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  push_enabled: boolean;
  push_booking_updates: boolean;
  push_reminders: boolean;
  push_payment_updates: boolean;
  email_booking_confirm: boolean;
  email_booking_reminder: boolean;
  email_booking_complete: boolean;
  email_booking_cancelled: boolean;
  email_payment_received: boolean;
  email_promotions: boolean;
  sms_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  push_booking_updates: true,
  push_reminders: true,
  push_payment_updates: true,
  email_booking_confirm: true,
  email_booking_reminder: true,
  email_booking_complete: true,
  email_booking_cancelled: true,
  email_payment_received: true,
  email_promotions: false,
  sms_enabled: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            push_enabled: data.push_enabled,
            push_booking_updates: data.push_booking_updates,
            push_reminders: data.push_reminders,
            push_payment_updates: data.push_payment_updates,
            email_booking_confirm: data.email_booking_confirm,
            email_booking_reminder: data.email_booking_reminder,
            email_booking_complete: data.email_booking_complete,
            email_booking_cancelled: data.email_booking_cancelled,
            email_payment_received: data.email_payment_received,
            email_promotions: data.email_promotions,
            sms_enabled: data.sms_enabled,
          });
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!user) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, [key]: value }));

      try {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Preference updated');
      } catch (err) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [key]: !value }));
        console.error('Error updating preference:', err);
        toast.error('Failed to update preference');
      }
    },
    [user]
  );

  return { preferences, isLoading, updatePreference };
}
