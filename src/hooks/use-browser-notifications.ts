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
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  // Check if browser notifications are supported and detect environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running in secure context (HTTPS required for notifications on mobile)
      const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      setIsSecureContext(secure);

      // Detect mobile devices
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);

      // Check document visibility
      setIsDocumentVisible(!document.hidden);

      if ('Notification' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);

        // Log debugging information
        console.log('Notification support detected:', {
          supported: true,
          permission: Notification.permission,
          secureContext: secure,
          isMobile: mobile,
          userAgent: navigator.userAgent.substring(0, 100) + '...'
        });
      } else {
        console.log('Notifications not supported in this browser');
      }
    }
  }, []);

  // Track document visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Request permission for notifications
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (!isSecureContext && isMobile) {
      console.warn('Mobile browsers require HTTPS for notifications. Current protocol:', window.location.protocol);
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      console.log('Notification permission result:', result, {
        isMobile,
        isSecureContext,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      });

      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported, isSecureContext, isMobile]);

  // Show a browser notification
  const showNotification = useCallback((options: BrowserNotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Browser notifications not permitted or supported');
      return null;
    }

    // On mobile, only show notifications when the app is not in focus
    // On desktop, show them regardless for better UX
    if (isMobile && isDocumentVisible) {
      console.log('Skipping notification on mobile - app is in focus');
      return null;
    }

    try {
      // Mobile-specific notification options
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/android-icon-192x192.png',
        badge: options.badge || '/android-icon-96x96.png',
        tag: options.tag || 'live-share-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
      };

      // Add vibration for mobile devices
      if (isMobile && 'vibrate' in navigator) {
        (notificationOptions as NotificationOptions & { vibrate?: number[] }).vibrate = [200, 100, 200];
      }

      const notification = new Notification(options.title, notificationOptions);

      console.log('Notification shown:', {
        title: options.title,
        isMobile,
        isDocumentVisible,
        hasVibration: !!(notificationOptions as { vibrate?: number[] }).vibrate
      });

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error, {
        isMobile,
        isSecureContext,
        permission
      });
      return null;
    }
  }, [isSupported, permission, isMobile, isDocumentVisible, isSecureContext]);

  // Close a notification
  const closeNotification = useCallback((notification: Notification | null) => {
    if (notification) {
      notification.close();
    }
  }, []);

  return {
    isSupported,
    permission,
    isSecureContext,
    isMobile,
    isDocumentVisible,
    requestPermission,
    showNotification,
    closeNotification,
  };
};
