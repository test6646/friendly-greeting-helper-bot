
import { useState, useCallback } from 'react';
import { 
  fetchCaptainNotifications,
  processNotifications,
  vibrateDevice
} from '@/services/notificationManagerService';
import { fetchOrderDetails } from '@/utils/captainOrderUtils';
import { toast } from 'sonner';

export const useNotificationData = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Function to handle showing a notification
  const handleShowNotification = useCallback(async (notification: any) => {
    if (!notification) return;
    
    console.log("Showing notification:", notification);
    setCurrentNotification(notification);
    setLoading(true);
    
    // Fetch order details
    const details = await fetchOrderDetails(notification.related_entity_id);
    setOrderDetails(details);
    setNotificationOpen(true);
    setLoading(false);
  }, []);

  // Load notifications for a captain
  const loadNotifications = useCallback(async (userId: string, setupTimeoutFn: (notification: any, onExpire: () => void) => void) => {
    try {
      // Get notifications from the database
      const fetchedNotifications = await fetchCaptainNotifications(userId);
      
      // Process notifications (filter expired ones and mark them as read)
      const validNotifications = await processNotifications(fetchedNotifications);
      
      // Setup timeouts for each valid notification
      validNotifications.forEach(notification => {
        setupTimeoutFn(notification, () => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          
          // If this is the current notification, close it
          if (currentNotification?.id === notification.id) {
            setCurrentNotification(null);
            setNotificationOpen(false);
            setOrderDetails(null);
          }
        });
      });
      
      // Update state
      setNotifications(validNotifications);
      
      // Auto-open the newest notification if none is currently showing
      if (validNotifications.length > 0 && !currentNotification && !notificationOpen) {
        await handleShowNotification(validNotifications[0]);
      }
      
      return validNotifications;
    } catch (error) {
      console.error('Error loading captain notifications:', error);
      return [];
    }
  }, [currentNotification, notificationOpen, handleShowNotification]);

  // Handle new notification
  const handleNewNotification = useCallback((
    newNotification: any, 
    setupTimeoutFn: (notification: any, onExpire: () => void) => void
  ) => {
    // Setup timeout for the new notification
    setupTimeoutFn(newNotification, () => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      
      // If this is the current notification, close it
      if (currentNotification?.id === newNotification.id) {
        setCurrentNotification(null);
        setNotificationOpen(false);
        setOrderDetails(null);
      }
    });
    
    // Add to notifications state
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-open newest notification if none is currently open
    if (!notificationOpen) {
      vibrateDevice();
      handleShowNotification(newNotification);
      
      toast.info("New delivery available!", {
        description: "Check the notification to accept this delivery",
        duration: 10000
      });
    } else {
      // Still show toast even if we don't open it
      toast.info("New delivery available", {
        description: "You have a new delivery request waiting",
        duration: 8000
      });
    }
  }, [notificationOpen, currentNotification, handleShowNotification]);

  // Remove a notification from the list
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    notifications,
    setNotifications,
    currentNotification,
    setCurrentNotification,
    notificationOpen,
    setNotificationOpen,
    orderDetails,
    setOrderDetails,
    loading,
    setLoading,
    handleShowNotification,
    loadNotifications,
    handleNewNotification,
    removeNotification
  };
};
