import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if browser notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission for notifications
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Show a browser notification
  const showNotification = useCallback((options: BrowserNotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Browser notifications not permitted or supported');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/android-icon-192x192.png',
        badge: options.badge || '/android-icon-96x96.png',
        tag: options.tag || 'live-share-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
      });

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  // Close a notification
  const closeNotification = useCallback((notification: Notification | null) => {
    if (notification) {
      notification.close();
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    closeNotification,
  };
};
