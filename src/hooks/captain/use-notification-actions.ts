
import { useCallback } from 'react';
import { 
  acceptDeliveryOrder,
  declineDeliveryOrder
} from '@/utils/captainOrderUtils';
import { toast } from 'sonner';

interface NotificationActionsProps {
  currentNotification: any;
  orderDetails: any;
  userId: string | undefined;
  removeNotification: (id: string) => void;
  clearTimeout: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setCurrentNotification: (notification: any) => void;
  setOrderDetails: (details: any) => void;
  setNotificationOpen: (isOpen: boolean) => void;
  handleShowNotification: (notification: any) => Promise<void>;
  notifications: any[];
}

export const useNotificationActions = ({
  currentNotification,
  orderDetails,
  userId,
  removeNotification,
  clearTimeout,
  setLoading,
  setCurrentNotification,
  setOrderDetails,
  setNotificationOpen,
  handleShowNotification,
  notifications
}: NotificationActionsProps) => {
  
  // Handle accepting a notification/order
  const handleNotificationAccept = useCallback(async () => {
    if (!currentNotification || !userId) return;
    
    try {
      setLoading(true);
      
      const success = await acceptDeliveryOrder(
        currentNotification, 
        orderDetails,
        userId
      );
      
      if (success) {
        toast.success("Order accepted for delivery", {
          description: "You can start this delivery now"
        });
        
        // Remove this notification from the list
        const completedNotificationId = currentNotification.id;
        removeNotification(completedNotificationId);
        
        // Clear current notification
        setCurrentNotification(null);
        setOrderDetails(null);
        setNotificationOpen(false);
        
        // Clear timeout for this notification
        clearTimeout(completedNotificationId);
        
        // Show next notification if available
        setTimeout(() => {
          const nextNotification = notifications.find(n => n.id !== completedNotificationId);
          if (nextNotification) {
            handleShowNotification(nextNotification);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error in handleNotificationAccept:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentNotification,
    userId,
    orderDetails,
    removeNotification,
    setCurrentNotification,
    setOrderDetails,
    setNotificationOpen,
    clearTimeout,
    handleShowNotification,
    notifications,
    setLoading
  ]);

  // Handle declining a notification/order
  const handleNotificationDecline = useCallback(async () => {
    if (!currentNotification) return;
    
    try {
      setLoading(true);
      
      const success = await declineDeliveryOrder(currentNotification);
      
      if (success) {
        toast.info("Order declined");
        
        // Remove this notification from the list
        const declinedNotificationId = currentNotification.id;
        removeNotification(declinedNotificationId);
        
        // Clear current notification
        setCurrentNotification(null);
        setOrderDetails(null);
        setNotificationOpen(false);
        
        // Clear timeout for this notification
        clearTimeout(declinedNotificationId);
        
        // Show next notification if available
        setTimeout(() => {
          const nextNotification = notifications.find(n => n.id !== declinedNotificationId);
          if (nextNotification) {
            handleShowNotification(nextNotification);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error declining order:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentNotification,
    removeNotification,
    setCurrentNotification,
    setOrderDetails,
    setNotificationOpen,
    clearTimeout,
    handleShowNotification,
    notifications,
    setLoading
  ]);

  return {
    handleNotificationAccept,
    handleNotificationDecline
  };
};
