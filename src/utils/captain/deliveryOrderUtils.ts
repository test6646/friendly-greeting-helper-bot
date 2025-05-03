
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { markNotificationAsRead, createSellerNotification } from './notificationUtils';

// Accept delivery order
export const acceptDeliveryOrder = async (
  notification: any, 
  orderDetails: any, 
  userId: string
) => {
  if (!notification?.related_entity_id || !orderDetails) {
    toast.error("Order details not available");
    return false;
  }
  
  try {
    console.log("Accepting order:", notification.related_entity_id);
    
    // First, get the captain profile ID that matches the user ID
    const { data: captainProfile, error: captainError } = await supabase
      .from('captain_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (captainError || !captainProfile) {
      console.error("Error fetching captain profile:", captainError);
      toast.error("Captain profile not found");
      return false;
    }
    
    const captainId = captainProfile.id;
    console.log("Using captain profile ID:", captainId);
    
    // Now update the order status to captain_assigned (new status)
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'captain_assigned' })
      .eq('id', notification.related_entity_id);
      
    if (orderError) {
      console.error("Error updating order status:", orderError);
      throw orderError;
    }
    
    // Then create the delivery record using the captain profile ID
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        order_id: notification.related_entity_id,
        captain_id: captainId,
        status: 'accepted',
        delivery_fee: orderDetails.delivery_fee || 0,
        pickup_time: new Date().toISOString()
      });
      
    if (deliveryError) {
      console.error("Error creating delivery:", deliveryError);
      
      // If the delivery creation fails, revert the order status
      await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', notification.related_entity_id);
        
      throw deliveryError;
    }
    
    // Create a notification for the seller
    await createSellerNotification(
      orderDetails.seller_id,
      notification.related_entity_id,
      captainId,
      "captain_assigned"
    );
    
    // Mark notification as read
    await markNotificationAsRead(notification.id);

    return true;
  } catch (error) {
    console.error("Error accepting order:", error);
    toast.error("Failed to accept order");
    return false;
  }
};

// Decline delivery order
export const declineDeliveryOrder = async (notification: any) => {
  if (!notification) return false;
  
  try {
    console.log("Declining order:", notification);
    
    // Mark notification as read
    await markNotificationAsRead(notification.id);
    return true;
  } catch (error) {
    console.error("Error declining order:", error);
    toast.error("Failed to decline order");
    return false;
  }
};

// Update delivery status to picked up
export const updateDeliveryToPickedUp = async (deliveryId: string, orderId: string, sellerId: string) => {
  try {
    console.log("Updating delivery to picked up:", deliveryId);
    
    // Update the delivery status
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .update({ 
        status: 'picked_up',
        pickup_time: new Date().toISOString()
      })
      .eq('id', deliveryId);
    
    if (deliveryError) {
      console.error("Error updating delivery status:", deliveryError);
      throw deliveryError;
    }
    
    // Update the order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'picked_up' })
      .eq('id', orderId);
    
    if (orderError) {
      console.error("Error updating order status:", orderError);
      throw orderError;
    }

    // Get captain profile id from delivery for notification
    const { data: deliveryData } = await supabase
      .from('deliveries')
      .select('captain_id')
      .eq('id', deliveryId)
      .single();
    
    if (deliveryData) {
      // Create notification for seller
      await createSellerNotification(
        sellerId,
        orderId,
        deliveryData.captain_id,
        "order_picked_up"
      );
    }
    
    return true;
  } catch (error) {
    console.error("Error updating delivery to picked up:", error);
    toast.error("Failed to update delivery status");
    return false;
  }
};

// Update delivery status to out for delivery
export const updateDeliveryToOutForDelivery = async (deliveryId: string, orderId: string, sellerId: string) => {
  try {
    console.log("Updating delivery to out for delivery:", deliveryId);
    
    // Update delivery status
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .update({ status: 'out_for_delivery' })
      .eq('id', deliveryId);
    
    if (deliveryError) {
      console.error("Error updating delivery status:", deliveryError);
      throw deliveryError;
    }
    
    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'out_for_delivery' })
      .eq('id', orderId);
      
    if (orderError) {
      console.error("Error updating order status:", orderError);
      throw orderError;
    }
    
    // Get captain profile id from delivery for notification
    const { data: deliveryData } = await supabase
      .from('deliveries')
      .select('captain_id')
      .eq('id', deliveryId)
      .single();
    
    if (deliveryData) {
      // Create notification for seller
      await createSellerNotification(
        sellerId,
        orderId,
        deliveryData.captain_id,
        "order_out_for_delivery"
      );
    }
    
    return true;
  } catch (error) {
    console.error("Error updating delivery to out for delivery:", error);
    toast.error("Failed to update delivery status");
    return false;
  }
};

// Update delivery status to delivered
export const updateDeliveryToDelivered = async (deliveryId: string, orderId: string, sellerId: string) => {
  try {
    console.log("Updating delivery to delivered:", deliveryId);
    
    const now = new Date().toISOString();
    
    // Update delivery status
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .update({ 
        status: 'delivered',
        delivery_time: now
      })
      .eq('id', deliveryId);
    
    if (deliveryError) {
      console.error("Error updating delivery status:", deliveryError);
      throw deliveryError;
    }
    
    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivered',
        updated_at: now 
      })
      .eq('id', orderId);
      
    if (orderError) {
      console.error("Error updating order status:", orderError);
      throw orderError;
    }
    
    // Get captain profile id from delivery for notification
    const { data: deliveryData } = await supabase
      .from('deliveries')
      .select('captain_id')
      .eq('id', deliveryId)
      .single();
    
    if (deliveryData) {
      // Create notification for seller
      await createSellerNotification(
        sellerId,
        orderId,
        deliveryData.captain_id,
        "order_delivered"
      );

      // Also update captain's total_deliveries
      // First get the current count
      const { data: captainData } = await supabase
        .from('captain_profiles')
        .select('total_deliveries')
        .eq('id', deliveryData.captain_id)
        .single();
        
      const currentDeliveries = captainData?.total_deliveries || 0;
      
      // Then update with incremented value
      await supabase
        .from('captain_profiles')
        .update({ total_deliveries: currentDeliveries + 1 })
        .eq('id', deliveryData.captain_id);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating delivery to delivered:", error);
    toast.error("Failed to update delivery status");
    return false;
  }
};
