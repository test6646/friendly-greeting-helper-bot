
import React, { useEffect, useState } from 'react';
import CaptainDeliveryAlertBanner from './CaptainDeliveryAlertBanner';
import CaptainOrderNotification from './CaptainOrderNotification';
import { useCaptainNotifications } from '@/hooks/captain/use-captain-notifications';
import { toast } from '@/hooks/use-toast';
import { fetchOrderDetails } from '@/utils/captainOrderUtils';
import { useAuth } from '@/contexts/AuthContext';
import { isNotificationExpired, setupNotificationTimeout } from '@/utils/notificationExpiryUtils';

const CaptainNewDeliveryAlert = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    notifications,
    handleNotificationAccept,
    handleNotificationDecline,
  } = useCaptainNotifications();

  // Alert when a new order arrives
  useEffect(() => {
    if (notifications.length > 0) {
      console.log("New notifications detected in CaptainNewDeliveryAlert:", notifications.length);
      
      // Only show toast when there are notifications but dialog is not open yet
      if (!isDialogOpen && !isNotificationExpired(notifications[0])) {
        console.log("Showing delivery notification toast");
        
        // Try to vibrate device if supported
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
        
        // Play notification sound if available
        const notifSound = new Audio('/sounds/notification.mp3');
        notifSound.play().catch(e => console.log('Could not play notification sound', e));
        
        toast.info("New delivery available!", "You have a new order ready for pickup");
      }
    }
  }, [notifications.length, isDialogOpen]);

  // Function to handle showing notification dialog
  const handleShowNotification = async (notification: any) => {
    if (!notification) return;
    
    // Check if notification is expired
    if (isNotificationExpired(notification)) {
      console.log("Notification is expired, not showing dialog");
      toast.info("This order is no longer available");
      return;
    }
    
    console.log("Showing notification:", notification);
    setCurrentNotification(notification);
    setLoading(true);
    setIsDialogOpen(true);
    
    try {
      // Fetch order details
      const details = await fetchOrderDetails(notification.related_entity_id);
      if (details) {
        setOrderDetails(details);
        console.log("Order details fetched successfully:", details);
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      setIsDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Return null if there are no notifications
  if (notifications.length === 0) {
    console.log("No notifications to display in CaptainNewDeliveryAlert");
    return null;
  }

  console.log("Rendering CaptainNewDeliveryAlert with notifications:", notifications.length);
  return (
    <>
      <CaptainDeliveryAlertBanner 
        notificationCount={notifications.length}
        onViewDelivery={() => {
          console.log("View delivery clicked, showing notification:", notifications[0]);
          handleShowNotification(notifications[0]);
        }}
      />

      {currentNotification && (
        <CaptainOrderNotification
          notification={currentNotification}
          onAccept={async () => {
            setLoading(true);
            try {
              const success = await handleNotificationAccept(currentNotification, orderDetails);
              if (success) {
                setIsDialogOpen(false);
                setCurrentNotification(null);
                setOrderDetails(null);
              } else {
                throw new Error("Failed to accept notification");
              }
            } catch (error) {
              console.error("Error accepting notification:", error);
              toast.error("Failed to accept delivery");
            } finally {
              setLoading(false);
            }
          }}
          onDecline={async () => {
            setLoading(true);
            try {
              const success = await handleNotificationDecline(currentNotification);
              if (success) {
                setIsDialogOpen(false);
                setCurrentNotification(null);
                setOrderDetails(null);
              } else {
                throw new Error("Failed to decline notification");
              }
            } catch (error) {
              console.error("Error declining notification:", error);
              toast.error("Failed to decline delivery");
            } finally {
              setLoading(false);
            }
          }}
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          orderDetails={orderDetails}
          loading={loading}
        />
      )}
    </>
  );
};

export default CaptainNewDeliveryAlert;
