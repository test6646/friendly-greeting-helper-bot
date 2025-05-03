
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotificationExpired } from '@/utils/notificationExpiryUtils';
import { markNotificationAsRead } from '@/utils/captainOrderUtils';
import { setupNotificationListener } from '@/services/notificationManagerService';
import { toast } from 'sonner';

export const useNotificationListeners = (
  userId: string | undefined,
  currentNotification: any,
  handleNewNotification: (notification: any, setupTimeout: any) => void,
  setupTimeout: (notification: any, onExpire: () => void) => void,
  setNotifications: (updater: (prevNotifications: any[]) => any[]) => void,
  setCurrentNotification: (notification: any) => void,
  setNotificationOpen: (isOpen: boolean) => void,
  setOrderDetails: (details: any) => void
) => {
  // Poll for notification expiration (backup for timeout)
  const setupExpirationChecker = useCallback(() => {
    const interval = setInterval(() => {
      setNotifications(prevNotifications => {
        // Filter out expired notifications
        const updatedNotifications = prevNotifications.filter(n => !isNotificationExpired(n));
        
        // If current notification expired, clear it
        if (currentNotification && isNotificationExpired(currentNotification)) {
          if (currentNotification.id) {
            markNotificationAsRead(currentNotification.id);
          }
          setCurrentNotification(null);
          setNotificationOpen(false);
          setOrderDetails(null);
          
          toast.info("Order notification expired", {
            description: "This order is no longer available"
          });
        }
        
        return updatedNotifications;
      });
    }, 30000); // Check every 30 seconds as a backup
    
    return interval;
  }, [currentNotification, setNotifications, setCurrentNotification, setNotificationOpen, setOrderDetails]);

  // Setup real-time listener
  const setupRealtimeListener = useCallback((userId: string) => {
    console.log("Setting up realtime notification listener for captain:", userId);
    
    // Setup listener for new notifications
    return setupNotificationListener(
      userId,
      (newNotification) => {
        console.log("New notification received through realtime listener:", newNotification);
        handleNewNotification(newNotification, setupTimeout);
      }
    );
  }, [handleNewNotification, setupTimeout]);

  return {
    setupExpirationChecker,
    setupRealtimeListener
  };
};
