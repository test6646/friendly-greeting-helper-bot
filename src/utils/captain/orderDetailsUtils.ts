
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SellerProfileSimplified } from '@/interfaces/supabase';

// Define a type for the order details with seller profile
interface OrderWithSeller {
  id: string;
  total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  seller_id: string;
  address_id: string;
  address?: any;
  seller_profile?: SellerProfileSimplified;
}

// Function to fetch order details
export const fetchOrderDetails = async (orderId: string): Promise<OrderWithSeller | null> => {
  if (!orderId) {
    console.error("No order ID provided");
    return null;
  }
  
  try {
    console.log("Fetching order details for:", orderId);
    
    // First get the order information
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        delivery_fee,
        status,
        created_at,
        seller_id,
        address_id,
        address:address_id(*)
      `)
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error("Error fetching order details:", orderError);
      throw orderError;
    }
    
    if (!orderData) {
      console.error("No order found with ID:", orderId);
      return null;
    }
    
    // Create the result object
    const result: OrderWithSeller = {
      ...orderData,
      seller_profile: undefined
    };
    
    // Now fetch the seller profile separately if we have a seller_id
    if (orderData && orderData.seller_id) {
      // Only select fields that exist in the seller_profiles table
      const { data: sellerData, error: sellerError } = await supabase
        .from('seller_profiles')
        .select(`
          id, 
          business_name, 
          cover_image_url,
          business_description,
          verification_status,
          kitchen_open
        `)
        .eq('id', orderData.seller_id)
        .single();
        
      if (!sellerError && sellerData) {
        // Ensure we have all required fields for SellerProfileSimplified
        result.seller_profile = {
          id: sellerData.id,
          business_name: sellerData.business_name,
          business_description: sellerData.business_description,
          verification_status: sellerData.verification_status,
          kitchen_open: sellerData.kitchen_open
        };
      } else if (sellerError) {
        console.error("Error fetching seller profile:", sellerError);
        
        // Provide a default seller profile to avoid type errors - properly typed now
        result.seller_profile = {
          id: orderData.seller_id,
          business_name: "Unknown Restaurant",
          business_description: null,
          verification_status: null,
          kitchen_open: null
        };
      }
    }
    
    console.log("Order details for captain:", result);
    return result;
    
  } catch (error) {
    console.error("Error fetching order details:", error);
    toast.error("Failed to load order details");
    return null;
  }
};
