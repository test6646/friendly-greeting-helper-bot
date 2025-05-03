
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  acceptDeliveryOrder, 
  declineDeliveryOrder, 
  markNotificationAsRead 
} from '@/utils/captainOrderUtils';
import { isNotificationExpired } from '@/utils/notificationExpiryUtils';

export const useCaptainNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timeouts, setTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});

  // Load notifications
  useEffect(() => {
    if (!user) return;

    console.log("Setting up notifications for captain:", user.id);
    loadNotifications();
    
    // Set up realtime listener for new notifications
    const channel = supabase
      .channel('captain-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          if (payload.new.type === 'delivery' && !isNotificationExpired(payload.new)) {
            // Add to notifications
            setNotifications(prev => [payload.new, ...prev]);
            
            // Create timeout
            setupTimeout(payload.new);
            
            // Vibrate and play sound
            if (navigator.vibrate) {
              navigator.vibrate([300, 100, 300]);
            }
          }
        }
      )
      .subscribe();
    
    // Check for expired notifications every 30 seconds
    const expirationChecker = setInterval(() => {
      setNotifications(prev => {
        const validNotifications = prev.filter(notification => !isNotificationExpired(notification));
        
        // Mark expired ones as read
        prev.forEach(notification => {
          if (isNotificationExpired(notification) && !notification.is_read) {
            markNotificationAsRead(notification.id);
          }
        });
        
        return validNotifications;
      });
    }, 30000);

    // Clean up on unmount
    return () => {
      supabase.removeChannel(channel);
      clearInterval(expirationChecker);
      
      // Clear all timeouts
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [user]);

  // Setup timeout for notification expiry
  const setupTimeout = useCallback((notification: any) => {
    if (!notification) return;
    
    // Calculate time until expiry (2 minutes from creation)
    const createdAt = new Date(notification.created_at);
    const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000);
    const timeUntilExpiry = expiryTime.getTime() - Date.now();
    
    console.log(`Setting timeout for notification ${notification.id}: ${timeUntilExpiry}ms remaining`);
    
    if (timeUntilExpiry <= 0) return; // Already expired
    
    // Create timeout to remove notification when expired
    const timeoutId = setTimeout(() => {
      console.log(`Notification ${notification.id} expired`);
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notification.id)
      );
      
      // Remove from timeouts
      setTimeouts(prev => {
        const { [notification.id]: _, ...rest } = prev;
        return rest;
      });
      
      // Mark as read in database
      markNotificationAsRead(notification.id);
    }, timeUntilExpiry);
    
    // Store timeout ID
    setTimeouts(prev => ({
      ...prev,
      [notification.id]: timeoutId
    }));
  }, []);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'delivery')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched notifications:", data?.length || 0, data);
      
      // Filter out expired notifications
      const validNotifications = data?.filter(notification => !isNotificationExpired(notification)) || [];
      
      // Mark expired ones as read
      data?.forEach(notification => {
        if (isNotificationExpired(notification)) {
          markNotificationAsRead(notification.id);
        }
      });
      
      // Set up timeouts for valid notifications
      validNotifications.forEach(notification => {
        setupTimeout(notification);
      });
      
      setNotifications(validNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [user, setupTimeout]);

  // Handle notification acceptance
  const handleNotificationAccept = useCallback(async (notification: any, orderDetails: any) => {
    if (!notification || !user?.id) {
      toast.error("Missing notification data");
      return false;
    }
    
    try {
      const success = await acceptDeliveryOrder(
        notification,
        orderDetails,
        user.id
      );
      
      if (success) {
        toast.success("Order accepted for delivery", {
          description: "You can start this delivery now"
        });
        
        // Remove from notifications
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
        
        // Clear timeout
        if (timeouts[notification.id]) {
          clearTimeout(timeouts[notification.id]);
          setTimeouts(prev => {
            const { [notification.id]: _, ...rest } = prev;
            return rest;
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error accepting notification:", error);
      toast.error("Failed to accept delivery");
      return false;
    }
  }, [user?.id, timeouts]);

  // Handle notification decline
  const handleNotificationDecline = useCallback(async (notification: any) => {
    if (!notification) {
      return false;
    }
    
    try {
      const success = await declineDeliveryOrder(notification);
      
      if (success) {
        toast.info("Order declined");
        
        // Remove from notifications
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
        
        // Clear timeout
        if (timeouts[notification.id]) {
          clearTimeout(timeouts[notification.id]);
          setTimeouts(prev => {
            const { [notification.id]: _, ...rest } = prev;
            return rest;
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error declining notification:", error);
      toast.error("Failed to decline delivery");
      return false;
    }
  }, [timeouts]);

  return {
    notifications,
    handleNotificationAccept,
    handleNotificationDecline,
    loadNotifications
  };
};
