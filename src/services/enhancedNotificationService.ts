
import { supabase } from '@/integrations/supabase/client';

// Create notifications for a new order
export const createOrderNotifications = async (
  orderData: any,
  customerId: string,
  sellerId: string,
  orderItems: any[]
) => {
  console.log("Creating order notifications with following data:");
  console.log("Order data:", orderData);
  console.log("Customer ID:", customerId);
  console.log("Seller ID:", sellerId);
  console.log("Order items:", orderItems);
  
  try {
    // First, we need to get the actual seller user_id from seller_profiles
    // because the sellerId might be the seller_profile.id, not the user_id
    const { data: sellerProfile, error: sellerProfileError } = await supabase
      .from('seller_profiles')
      .select('user_id')
      .eq('id', sellerId)
      .maybeSingle();
    
    if (sellerProfileError) {
      console.error("Error fetching seller profile:", sellerProfileError);
      console.log("Assuming sellerId is already user_id and proceeding...");
    }
    
    // If we found a seller profile, use its user_id, otherwise use the provided sellerId
    const sellerUserId = sellerProfile ? sellerProfile.user_id : sellerId;
    console.log("Final seller user ID for notification:", sellerUserId);
    
    // 1. Create notification for customer
    const customerNotification = {
      user_id: customerId,
      title: 'Order Placed',
      message: `Your order #${orderData.id.substring(0, 8)} has been placed successfully.`,
      type: 'order',
      related_entity_id: orderData.id,
      is_read: false
    };
    
    // 2. Create notification for seller
    const sellerNotification = {
      user_id: sellerUserId,
      title: 'New Order Received',
      message: `You have a new order #${orderData.id.substring(0, 8)} to prepare.`,
      type: 'order',
      related_entity_id: orderData.id,
      is_read: false
    };
    
    console.log("Customer notification:", customerNotification);
    console.log("Seller notification:", sellerNotification);
    
    // Insert both notifications
    const { error: customerError } = await supabase
      .from('notifications')
      .insert(customerNotification);
      
    if (customerError) {
      console.error("Error creating customer notification:", customerError);
    } else {
      console.log("Customer notification created successfully");
    }
    
    const { error: sellerError } = await supabase
      .from('notifications')
      .insert(sellerNotification);
      
    if (sellerError) {
      console.error("Error creating seller notification:", sellerError);
    } else {
      console.log("Seller notification created successfully");
    }
    
    console.log("Order notifications created successfully");
    
    return { customerNotification, sellerNotification };
    
  } catch (error) {
    console.error("Error in createOrderNotifications:", error);
    throw error;
  }
};

// Create notifications when an order status is updated
export const createOrderStatusNotification = async (
  orderId: string,
  customerId: string,
  status: string
) => {
  try {
    let title = '';
    let message = '';
    
    switch(status) {
      case 'preparing':
        title = 'Order Being Prepared';
        message = `Your order #${orderId.substring(0, 8)} is now being prepared.`;
        break;
      case 'ready':
        title = 'Order Ready';
        message = `Your order #${orderId.substring(0, 8)} is now ready for delivery.`;
        break;
      case 'out_for_delivery':
        title = 'Order Out for Delivery';
        message = `Your order #${orderId.substring(0, 8)} is now out for delivery.`;
        break;
      case 'completed':
        title = 'Order Completed';
        message = `Your order #${orderId.substring(0, 8)} has been delivered.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${orderId.substring(0, 8)} has been cancelled.`;
        break;
      default:
        title = 'Order Status Updated';
        message = `Your order #${orderId.substring(0, 8)} status has been updated to ${status}.`;
    }
    
    const notification = {
      user_id: customerId,
      title,
      message,
      type: 'order',
      related_entity_id: orderId,
      is_read: false
    };
    
    const { error } = await supabase
      .from('notifications')
      .insert(notification);
      
    if (error) {
      console.error("Error creating customer status notification:", error);
      return null;
    }
    
    return notification;
  } catch (error) {
    console.error("Error in createOrderStatusNotification:", error);
    throw error;
  }
};

// Notify available captains for order pickup
export const notifyCaptainsForOrderPickup = async (orderId: string, addressId: string) => {
  try {
    console.log("Finding available captains for order pickup:", orderId);
    
    if (!orderId) {
      console.error("No order ID provided for captain notification");
      return [];
    }
    
    // Get the order details to include in the notification
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        delivery_fee,
        address_id,
        seller_id,
        addresses:address_id(city, state)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error("Error fetching order for captain notification:", orderError);
      throw orderError;
    }
    
    console.log("Order data for captain notification:", orderData);
    
    // Get the seller info separately
    const { data: sellerData, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('business_name')
      .eq('id', orderData.seller_id)
      .single();
      
    if (sellerError) {
      console.error("Error fetching seller profile:", sellerError);
      console.log("Continuing with default seller name...");
    }
    
    const locationInfo = orderData.addresses ? `${orderData.addresses.city}, ${orderData.addresses.state}` : 'Unknown location';
    const sellerName = sellerData?.business_name || 'Seller';
    
    // Find all active captains who are available
    const { data: captains, error: captainsError } = await supabase
      .from('captain_profiles')
      .select('user_id, id')
      .eq('is_active', true)
      .eq('is_available', true);
    
    if (captainsError) {
      console.error("Error finding available captains:", captainsError);
      throw captainsError;
    }
    
    if (!captains || captains.length === 0) {
      console.log("No available captains found");
      return [];
    }
    
    console.log(`Found ${captains.length} available captains:`, captains);
    
    // Create notifications for all available captains
    const notificationsToCreate = captains.map(captain => ({
      user_id: captain.user_id,
      title: 'New Delivery Available',
      message: `Order #${orderId.substring(0, 8)} from ${sellerName} is ready for pickup at ${locationInfo}.`,
      type: 'delivery',
      related_entity_id: orderId,
      is_read: false
    }));
    
    console.log("Inserting captain notifications:", notificationsToCreate.length);
    
    // Insert notifications - use single query for better performance
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsToCreate)
      .select();
      
    if (error) {
      console.error("Error creating captain notifications:", error);
      return [];
    }
    
    console.log(`Successfully notified ${data.length} captains`);
    return data;
    
  } catch (error) {
    console.error("Error in notifyCaptainsForOrderPickup:", error);
    return [];
  }
};

// Function to create notification directly
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'order' | 'delivery' | 'payment' | 'system' | 'promo',
  relatedEntityId?: string
) => {
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
    
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// New function to listen to order status changes and trigger notifications
export const setupOrderStatusChangeListener = () => {
  console.log("Setting up order status change listener for ready orders");
  
  const channel = supabase
    .channel('order-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.ready'
      },
      async (payload) => {
        console.log('Order status changed to ready:', payload.new);
        try {
          // Notify all available captains about the ready order
          await notifyCaptainsForOrderPickup(
            payload.new.id,
            payload.new.address_id
          );
          
          // Notify the customer that their order is ready for delivery
          await createOrderStatusNotification(
            payload.new.id,
            payload.new.user_id,
            'ready'
          );
        } catch (error) {
          console.error('Error sending order ready notifications:', error);
        }
      }
    )
    .subscribe();
    
  console.log("Order status change listener setup completed");
  return channel;
};

// Initialize the order status change listener
let orderStatusListener: any = null;

export const initializeOrderStatusListener = () => {
  if (!orderStatusListener) {
    console.log("Initializing order status change listener");
    orderStatusListener = setupOrderStatusChangeListener();
  }
  return orderStatusListener;
};

// Make sure to call this function when the app initializes
initializeOrderStatusListener();
