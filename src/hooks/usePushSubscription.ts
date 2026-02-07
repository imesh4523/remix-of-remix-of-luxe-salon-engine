import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// VAPID public key - this is safe to expose in frontend
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;

  // Check current subscription status
  useEffect(() => {
    if (!user || !isPushSupported) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        setPermissionState(Notification.permission);

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Verify it exists in DB
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint)
            .eq('is_active', true)
            .maybeSingle();

          setIsSubscribed(!!data);
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('Error checking push subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user, isPushSupported]);

  const subscribeToPush = useCallback(async () => {
    if (!user || !isPushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Unsubscribe existing if any
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!key || !auth) throw new Error('Failed to get subscription keys');

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
      const authKey = btoa(String.fromCharCode(...new Uint8Array(auth)));

      // Deactivate old subscriptions for this user on this device
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      // Save new subscription
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: p256dh,
        auth_key: authKey,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        is_active: true,
      });

      if (error) throw error;

      // Also enable push in preferences
      await supabase
        .from('notification_preferences')
        .update({ push_enabled: true })
        .eq('user_id', user.id);

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
    } catch (err: unknown) {
      console.error('Error subscribing to push:', err);
      toast.error('Failed to enable push notifications');
    }
  }, [user, isPushSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Deactivate in DB
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      toast.error('Failed to disable push notifications');
    }
  }, [user]);

  return {
    isSubscribed,
    isLoading,
    isPushSupported,
    permissionState,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
