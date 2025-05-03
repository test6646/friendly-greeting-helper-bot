import { useState, useCallback } from 'react';
import { 
  setupNotificationTimeout,
  isNotificationExpired
} from '@/utils/notificationExpiryUtils';
import { markNotificationAsRead } from '@/utils/captainOrderUtils';
import { toast } from 'sonner';

export const useNotificationTimeouts = () => {
  // Keep track of notification timeouts
  const [timeoutIds, setTimeoutIds] = useState<Record<string, NodeJS.Timeout>>({});

  // Setup timeout for a notification
  const setupTimeout = useCallback((notification: any, onExpire: () => void) => {
    if (!notification || !notification.id) return;
    
    const timeoutId = setupNotificationTimeout(
      notification,
      timeoutIds[notification.id],
      () => {
        // Mark as read in the database
        markNotificationAsRead(notification.id);
        
        // Execute onExpire callback
        onExpire();
        
        // Remove from timeouts record
        setTimeoutIds(prev => {
          const updated = { ...prev };
          delete updated[notification.id];
          return updated;
        });
      }
    );
    
    // Store timeout ID
    setTimeoutIds(prev => ({
      ...prev,
      [notification.id]: timeoutId
    }));
    
    return timeoutId;
  }, [timeoutIds]);

  // Clear a specific timeout
  const clearNotificationTimeout = useCallback((notificationId: string) => {
    if (timeoutIds[notificationId]) {
      clearTimeout(timeoutIds[notificationId]);
      setTimeoutIds(prev => {
        const updated = { ...prev };
        delete updated[notificationId];
        return updated;
      });
    }
  }, [timeoutIds]);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    Object.values(timeoutIds).forEach(id => clearTimeout(id));
    setTimeoutIds({});
  }, [timeoutIds]);

  // Check if notification is expired
  const checkNotificationExpiry = useCallback((notification: any, onExpire: () => void) => {
    if (notification && isNotificationExpired(notification)) {
      if (notification.id) {
        markNotificationAsRead(notification.id);
      }
      
      onExpire();
      
      toast.info("Order notification expired", {
        description: "This order is no longer available"
      });
      
      return true;
    }
    return false;
  }, []);

  return {
    timeoutIds,
    setupTimeout,
    clearNotificationTimeout,
    clearAllTimeouts,
    checkNotificationExpiry
  };
};
