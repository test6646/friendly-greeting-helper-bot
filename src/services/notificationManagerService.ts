
import { supabase } from '@/integrations/supabase/client';
import { isNotificationExpired } from '@/utils/notificationExpiryUtils';
import { markNotificationAsRead } from '@/utils/captainOrderUtils';

// Fetch captain's delivery notifications from database
export const fetchCaptainNotifications = async (userId: string) => {
  try {
    console.log("Fetching delivery notifications for captain:", userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'delivery')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
    
    console.log("Fetched notifications:", data?.length || 0, data);
    return data || [];
  } catch (error) {
    console.error('Error fetching captain notifications:', error);
    return [];
  }
};

// Filter and process notifications
export const processNotifications = async (notifications: any[]) => {
  try {
    // Filter out expired notifications
    const validNotifications = filterExpiredNotifications(notifications);
    console.log("Valid notifications after filtering:", validNotifications.length);
    
    // Mark expired notifications as read
    const expiredNotifications = notifications.filter(n => isNotificationExpired(n));
    for (const expiredNotif of expiredNotifications) {
      if (expiredNotif && expiredNotif.id) {
        await markNotificationAsRead(expiredNotif.id);
      }
    }
    
    return validNotifications;
  } catch (error) {
    console.error("Error processing notifications:", error);
    return [];
  }
};

// Filter out expired notifications
export const filterExpiredNotifications = (notifications: any[]) => {
  return notifications.filter(notification => !isNotificationExpired(notification));
};

// Set up notification listeners
export const setupNotificationListener = (userId: string, onNewNotification: (notification: any) => void) => {
  console.log("Setting up notification listener for captain:", userId);
  
  // Subscribe to new notifications
  const channel = supabase
    .channel('captain-delivery-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('New notification received:', payload.new);
        
        // Only process delivery notifications
        if (payload.new.type !== 'delivery') {
          console.log('Ignoring non-delivery notification');
          return;
        }
        
        // Skip if notification is already expired
        if (isNotificationExpired(payload.new)) {
          markNotificationAsRead(payload.new.id);
          return;
        }
        
        // Pass notification to callback
        onNewNotification(payload.new);
      }
    )
    .subscribe();
    
  // Debug - log channel status
  console.log("Channel subscription status:", channel.state);
  
  return channel;
};

// Vibrate device for notifications if supported
export const vibrateDevice = (pattern = [300, 100, 300]) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};
