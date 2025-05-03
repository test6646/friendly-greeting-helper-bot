
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from '@/utils/notificationSounds';

interface NotificationContextType {
  unreadCount: number;
  realtimeEnabled: boolean;
  toggleRealtime: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  realtimeEnabled: true,
  toggleRealtime: () => {},
  soundEnabled: true,
  toggleSound: () => {},
  refreshNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Get sound preference from localStorage with a default of true
    const savedPreference = localStorage.getItem('notificationSound');
    return savedPreference !== null ? savedPreference === 'true' : true;
  });

  // Get unread notification count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Play sound and show notification based on notification type
  const handleNewNotification = (payload: any) => {
    try {
      const notificationType = payload.new.type || 'system';
      const notificationTitle = payload.new.title || 'New notification';
      const notificationMessage = payload.new.message || '';
      
      // Play sound if enabled
      if (soundEnabled) {
        // Use a stronger alert for delivery notifications
        if (notificationType === 'delivery') {
          playNotificationSound('delivery', true);
        } else {
          playNotificationSound(notificationType, true);
        }
      }
      
      // Show toast notification
      toast(notificationTitle, {
        description: notificationMessage,
        duration: notificationType === 'delivery' ? 10000 : 5000, // Longer duration for delivery notifications
      });
      
      // Update unread count
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up real-time listener for user's notifications
    let notificationChannel: any;
    if (user && realtimeEnabled) {
      notificationChannel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New notification received:', payload.new);
            handleNewNotification(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id} AND is_read=eq.true`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();
    }

    // Cleanup
    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [user, realtimeEnabled, soundEnabled]);

  const toggleRealtime = () => {
    setRealtimeEnabled((prev) => !prev);
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('notificationSound', String(newSoundEnabled));
  };

  const refreshNotifications = () => {
    fetchUnreadCount();
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount, 
        realtimeEnabled, 
        toggleRealtime, 
        soundEnabled, 
        toggleSound,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
