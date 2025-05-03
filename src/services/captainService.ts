
import { supabase } from '@/integrations/supabase/client';
import { CaptainProfile, Delivery, DeliveryStatus, ServiceArea, AvailabilitySchedule, Location } from '@/models/Captain';
import { toast } from 'sonner';

/**
 * Get a captain profile by their user ID
 */
export const getCaptainProfileByUserId = async (userId: string): Promise<CaptainProfile | null> => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('captain_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Map the database fields to the CaptainProfile model with proper type casting
    return {
      id: data.id,
      userId: data.user_id,
      vehicleType: data.vehicle_type || '',
      vehicleRegistration: data.vehicle_registration || '',
      serviceAreas: (data.service_areas as any[] || []).map(area => ({
        name: area.name || '',
        coordinates: area.coordinates || undefined
      })) as ServiceArea[],
      availabilitySchedule: data.availability_schedule as AvailabilitySchedule || {},
      isActive: data.is_active || false,
      isAvailable: data.is_available || false,
      currentLocation: data.current_location ? {
        latitude: (data.current_location as any)?.latitude || 0,
        longitude: (data.current_location as any)?.longitude || 0,
        updatedAt: (data.current_location as any)?.updatedAt || new Date().toISOString()
      } as Location : null,
      verificationStatus: (data.verification_status || 'pending') as 'pending' | 'verified' | 'rejected',
      averageRating: data.average_rating || 0,
      totalDeliveries: data.total_deliveries || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching captain profile:', error);
    return null;
  }
};

/**
 * Update a captain's availability status
 */
export const updateCaptainAvailability = async (userId: string, isAvailable: boolean): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { error } = await supabase
      .from('captain_profiles')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating captain availability:', error);
    return false;
  }
};

/**
 * Update captain profile information
 */
export const updateCaptainProfile = async (
  userId: string,
  profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    vehicleType?: string;
    vehicleRegistration?: string;
  }
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Update the main profile data (name, phone)
    if (profileData.firstName || profileData.lastName || profileData.phone) {
      const profileUpdates: Record<string, any> = {};
      if (profileData.firstName) profileUpdates.first_name = profileData.firstName;
      if (profileData.lastName) profileUpdates.last_name = profileData.lastName;
      if (profileData.phone) profileUpdates.phone = profileData.phone;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
      
      if (profileError) throw profileError;
    }
    
    // Update the captain-specific data
    if (profileData.vehicleType || profileData.vehicleRegistration) {
      const captainUpdates: Record<string, any> = {};
      if (profileData.vehicleType) captainUpdates.vehicle_type = profileData.vehicleType;
      if (profileData.vehicleRegistration) captainUpdates.vehicle_registration = profileData.vehicleRegistration;
      captainUpdates.updated_at = new Date().toISOString();
      
      const { error: captainError } = await supabase
        .from('captain_profiles')
        .update(captainUpdates)
        .eq('user_id', userId);
      
      if (captainError) throw captainError;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating captain profile:', error);
    return false;
  }
};

/**
 * Get a list of deliveries for a captain
 */
export const getCaptainDeliveries = async (
  captainId: string,
  status?: DeliveryStatus | 'all',
  limit = 20,
  offset = 0
): Promise<Delivery[]> => {
  if (!captainId) return [];
  
  try {
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        orders:order_id (
          *,
          user:user_id (
            first_name,
            last_name,
            phone
          )
        )
      `)
      .eq('captain_id', captainId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data ? data.map(item => ({
      id: item.id,
      orderId: item.order_id,
      captainId: item.captain_id,
      pickupTime: item.pickup_time,
      deliveryTime: item.delivery_time,
      deliveryCode: item.delivery_code,
      deliveryProofUrl: item.delivery_proof_url,
      customerSignature: item.customer_signature || false,
      status: item.status as DeliveryStatus,
      deliveryNotes: item.delivery_notes,
      distance: item.distance,
      deliveryFee: item.delivery_fee,
      captainRating: item.captain_rating,
      customerRating: item.customer_rating,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      order: item.orders
    })) : [];
  } catch (error) {
    console.error('Error fetching captain deliveries:', error);
    return [];
  }
};

/**
 * Get available deliveries that a captain can accept
 */
export const getAvailableDeliveries = async (
  captainId: string,
  serviceAreas: string[] = [],
  limit = 20,
  offset = 0
): Promise<any[]> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        seller_profile:seller_id (
          business_name
        ),
        address:address_id (
          *
        ),
        items:id (
          id,
          meal_id,
          quantity,
          price,
          subtotal
        )
      `)
      .eq('status', 'ready')
      .is('delivery_id', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // If service areas are specified, filter by them
    // This would typically be a more complex query with geolocation
    // For now, we'll just return all available deliveries
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    return [];
  }
};

/**
 * Accept a delivery
 */
export const acceptDelivery = async (
  captainId: string,
  orderId: string
): Promise<boolean> => {
  if (!captainId || !orderId) return false;
  
  try {
    // Start a transaction to update both the delivery and order tables
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        captain_id: captainId,
        order_id: orderId,
        status: 'accepted',
        pickup_time: null,
        delivery_time: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (deliveryError) throw deliveryError;
    
    if (!delivery) throw new Error('Failed to create delivery record');
    
    // Update the order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'accepted_by_captain',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (orderError) throw orderError;
    
    return true;
  } catch (error) {
    console.error('Error accepting delivery:', error);
    return false;
  }
};

/**
 * Update a delivery status
 */
export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus,
  captainId: string
): Promise<boolean> => {
  if (!deliveryId || !status || !captainId) return false;
  
  try {
    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Add specific timestamp based on status
    if (status === 'picked_up') {
      updates.pickup_time = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivery_time = new Date().toISOString();
    }
    
    // Update the delivery
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', deliveryId)
      .eq('captain_id', captainId); // Security check
      
    if (deliveryError) throw deliveryError;
    
    // Update the order status
    let orderStatus = '';
    switch (status) {
      case 'picked_up':
        orderStatus = 'picked_up';
        break;
      case 'out_for_delivery':
        orderStatus = 'out_for_delivery';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        break;
      default:
        orderStatus = status;
    }
    
    if (orderStatus) {
      const { data: delivery, error: getError } = await supabase
        .from('deliveries')
        .select('order_id')
        .eq('id', deliveryId)
        .single();
        
      if (getError) throw getError;
      
      if (delivery) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: orderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', delivery.order_id);
          
        if (orderError) throw orderError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return false;
  }
};

/**
 * Get captain earnings for a time period
 */
export const getCaptainEarnings = async (
  captainId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalEarnings: number;
  deliveryCount: number;
  earningsByDay: { date: string; amount: number; deliveries: number }[];
}> => {
  if (!captainId) {
    return { totalEarnings: 0, deliveryCount: 0, earningsByDay: [] };
  }
  
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        id,
        delivery_fee,
        status,
        created_at,
        delivered_at: delivery_time
      `)
      .eq('captain_id', captainId)
      .eq('status', 'delivered')
      .gte('delivered_at', startDate)
      .lte('delivered_at', endDate);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { totalEarnings: 0, deliveryCount: 0, earningsByDay: [] };
    }
    
    // Calculate total earnings
    const totalEarnings = data.reduce((sum, delivery) => sum + (delivery.delivery_fee || 0), 0);
    
    // Group earnings by day
    const earningsByDay = data.reduce((acc: Record<string, any>, delivery) => {
      const date = new Date(delivery.delivered_at).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          amount: 0,
          deliveries: 0
        };
      }
      
      acc[date].amount += (delivery.delivery_fee || 0);
      acc[date].deliveries += 1;
      
      return acc;
    }, {});
    
    return {
      totalEarnings,
      deliveryCount: data.length,
      earningsByDay: Object.values(earningsByDay)
    };
  } catch (error) {
    console.error('Error fetching captain earnings:', error);
    return { totalEarnings: 0, deliveryCount: 0, earningsByDay: [] };
  }
};
