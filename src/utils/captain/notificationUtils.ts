
import { supabase } from '@/integrations/supabase/client';

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  if (!notificationId) return;
  
  try {
    console.log(`Marking notification ${notificationId} as read`);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Create notification for seller with specific type
export const createSellerNotification = async (
  sellerId: string,
  orderId: string,
  captainId: string,
  type: 'captain_assigned' | 'order_picked_up' | 'order_out_for_delivery' | 'order_delivered' = 'captain_assigned'
) => {
  if (!sellerId || !orderId || !captainId) return;
  
  try {
    // Get seller user_id from seller_id
    const { data: sellerData, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('user_id')
      .eq('id', sellerId)
      .single();
      
    if (sellerError || !sellerData) {
      console.error("Error fetching seller user ID:", sellerError);
      return;
    }
    
    // Get captain details - making sure we get actual fields that exist
    const { data: captainData, error: captainError } = await supabase
      .from('captain_profiles')
      .select('id, vehicle_type, vehicle_registration')
      .eq('id', captainId)
      .single();
      
    if (captainError || !captainData) {
      console.error("Error fetching captain details:", captainError);
      return;
    }
    
    // Determine notification title and message based on type
    let title = "Captain Assigned";
    let message = `Order #${orderId.substring(0, 8)} has been accepted by a delivery captain with ID ${captainId.substring(0, 8)}`;
    
    switch(type) {
      case 'captain_assigned':
        title = "Captain Assigned";
        message = `Order #${orderId.substring(0, 8)} has been accepted by a delivery captain with ID ${captainId.substring(0, 8)}`;
        break;
      case 'order_picked_up':
        title = "Order Picked Up";
        message = `Your order #${orderId.substring(0, 8)} has been picked up by the captain and is on the way`;
        break;
      case 'order_out_for_delivery':
        title = "Out For Delivery";
        message = `Your order #${orderId.substring(0, 8)} is now out for delivery`;
        break;
      case 'order_delivered':
        title = "Order Delivered";
        message = `Your order #${orderId.substring(0, 8)} has been successfully delivered`;
        break;
    }
    
    // Create notification for seller with sanitized captain information
    await supabase
      .from('notifications')
      .insert({
        user_id: sellerData.user_id,
        title: title,
        message: message,
        type: type,
        related_entity_id: orderId,
        is_read: false
      });
      
    console.log(`Created seller notification for ${type}`);
    
  } catch (error) {
    console.error("Error creating seller notification:", error);
  }
};
