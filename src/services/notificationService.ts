import { supabase } from "@/integrations/supabase/client";
import { Notification, NotificationType } from "@/models/Notification";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { playNotificationSound, NotificationSoundType } from "@/utils/notificationSounds";

// Check if a user ID is a test ID that would fail UUID validation
const isTestUserId = (userId?: string) => {
  return userId?.startsWith('test-') || !userId;
};

export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      // Don't fetch notifications for test users (they will fail UUID validation)
      if (!userId || isTestUserId(userId)) {
        console.log('Skipping notifications fetch for test user');
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching notifications:', error);
          throw error;
        }
        
        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          title: item.title,
          message: item.message,
          isRead: item.is_read,
          type: item.type as NotificationType,
          relatedEntityId: item.related_entity_id,
          createdAt: item.created_at
        } as Notification));
      } catch (error) {
        console.error('Error in notifications query:', error);
        return [];
      }
    },
    enabled: !!userId,
    // Test users will always get an empty array
    placeholderData: isTestUserId(userId) ? [] : undefined
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string, userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) {
        throw error;
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string, userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
      toast.success('Notification deleted');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  });
};

// Helper function to convert NotificationType to NotificationSoundType
const getNotificationSoundType = (type: NotificationType): NotificationSoundType => {
  switch (type) {
    case 'delivery':
      return 'delivery';
    case 'order':
      return 'order';
    case 'payment':
    case 'promo':
    case 'system':
    default:
      return 'system';
  }
};

// Helper function to create a notification with sound/vibration
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  relatedEntityId?: string,
  playSound = true
) => {
  // Skip DB operations for test users
  if (isTestUserId(userId)) {
    console.log('Skipping notification creation for test user');
    // Still play the sound if requested
    if (playSound) {
      const soundType = getNotificationSoundType(type);
      playNotificationSound(soundType);
    }
    return { success: true, id: 'test-notification' };
  }
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          related_entity_id: relatedEntityId,
          is_read: false
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    // Play notification sound if enabled
    if (playSound) {
      // Convert NotificationType to NotificationSoundType
      const soundType = getNotificationSoundType(type);
      playNotificationSound(soundType);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Function to create captain-specific notifications using stored procedure
export const createCaptainNotification = async (
  captainId: string,
  title: string,
  message: string,
  relatedEntityId?: string
) => {
  // Skip DB operations for test users
  if (isTestUserId(captainId)) {
    console.log('Skipping captain notification creation for test user');
    return { success: true, id: 'test-captain-notification' };
  }
  
  try {
    // Use RPC to create a captain notification
    const { data, error } = await supabase
      .rpc('create_captain_notification', {
        p_captain_id: captainId,
        p_title: title,
        p_message: message,
        p_related_entity_id: relatedEntityId || null
      });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating captain notification:', error);
    throw error;
  }
};
