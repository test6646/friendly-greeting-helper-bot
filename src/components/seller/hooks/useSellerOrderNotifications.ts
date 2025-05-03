
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useSellerOrderNotifications(sellerProfileId: string | undefined) {
  useEffect(() => {
    if (!sellerProfileId) return;
    
    console.log(`Setting up real-time order listener for seller ID: ${sellerProfileId}`);
    
    const channelName = `seller-orders-${sellerProfileId}`;
    
    // First remove any existing channel with the same name
    const existingChannels = supabase.getChannels();
    // Use a string comparison instead of accessing config.name
    const existingChannel = existingChannels.find(channel => {
      // Convert channel to string and check if it contains our channel name
      const channelString = String(channel);
      return channelString.includes(channelName);
    });
      
    if (existingChannel) {
      console.log(`Removing existing channel with name: ${channelName}`);
      supabase.removeChannel(existingChannel);
    }
    
    // Create a new channel for order updates
    const channel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${sellerProfileId}`
      }, (payload) => {
        console.log('New order received:', payload);
        toast.success('New Order Received!', `Order #${payload.new.id.substring(0, 8)} has been placed.`);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${sellerProfileId}`
      }, (payload) => {
        const oldStatus = payload.old.status;
        const newStatus = payload.new.status;
        
        if (oldStatus !== newStatus) {
          console.log(`Order ${payload.new.id} status changed from ${oldStatus} to ${newStatus}`);
          toast.info('Order Status Updated', `Order #${payload.new.id.substring(0, 8)} status changed to ${newStatus.toUpperCase()}`);
          
          // If the order is now ready, notify captains
          if (newStatus === 'ready') {
            console.log(`Order ${payload.new.id} is now ready, notifying captains...`);
            notifyCaptainsAboutOrder(payload.new.id, payload.new.address_id);
          }
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });
      
    console.log(`Channel ${channelName} subscribed successfully`);
    
    // Cleanup function to remove the channel when component unmounts
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log(`Removed channel ${channelName} on cleanup`);
      }
    };
  }, [sellerProfileId]);
}

// Function to notify captains about a ready order
async function notifyCaptainsAboutOrder(orderId: string, addressId: string) {
  try {
    console.log(`Notifying captains about order ${orderId} with address ${addressId}`);
    
    // Find available captains
    const { data: captains, error: captainsError } = await supabase
      .from('captain_profiles')
      .select('user_id')
      .eq('is_active', true)
      .eq('is_available', true);
      
    if (captainsError) {
      console.error("Error finding available captains:", captainsError);
      return;
    }
    
    if (!captains || captains.length === 0) {
      console.log("No available captains found");
      toast.warning('No Available Captains', 'There are currently no available captains to notify about this delivery.');
      return;
    }
    
    console.log(`Found ${captains.length} available captains:`, captains);
    toast.success('Captains Notified', `${captains.length} captains have been notified about the ready order.`);
    
    // Get order details for notification
    const { data: order } = await supabase
      .from('orders')
      .select(`
        id,
        seller_id,
        address_id,
        seller_profiles:seller_id(business_name)
      `)
      .eq('id', orderId)
      .single();
      
    if (!order) {
      console.error("Order not found for notifying captains");
      return;
    }
    
    // Create notifications for all available captains
    const notificationsToCreate = captains.map(captain => ({
      user_id: captain.user_id,
      title: 'New Delivery Available',
      message: `Order #${orderId.substring(0, 8)} is ready for pickup.`,
      type: 'delivery',
      related_entity_id: orderId,
      is_read: false
    }));
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationsToCreate);
      
    if (notificationError) {
      console.error("Error creating captain notifications:", notificationError);
    } else {
      console.log(`Successfully notified ${captains.length} captains`);
    }
    
  } catch (error) {
    console.error("Error notifying captains:", error);
  }
}
