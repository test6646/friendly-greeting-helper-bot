import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { SellerProfileSimplified, DeliveryProfile, SimplifiedMeal } from '@/interfaces/supabase';

export type SellerProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  cuisine_types: string[];
  service_areas: any; // JSON object with areas
  cover_image_url: string;
  gallery_images: string[];
  average_rating: number;
  rating_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  availability: any;
  commission_rate: number;
  kitchen_open: boolean; // Properly defined here
  verification_status: string;
  social_media?: any;
  special_diets?: string[];
  is_active?: boolean;
  is_promoted?: boolean;
};

export interface SellerAnalytics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_meals: number;
}

// Define the Meal type
export interface Meal {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price_single: number;
  price_weekly?: number;
  price_monthly?: number;
  discount_percent?: number;
  dietary_info?: any;
  nutritional_info?: any;
  preparation_time?: number;
  available_days?: any;
  max_orders_per_day?: number;
  available_quantity?: number;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  rating_count: number;
  created_at?: string;
  updated_at?: string;
  ingredients?: string[];
  category?: string;
  cuisine_type?: string;
  tags?: string[];
  images?: string[];
  // Update to match the actual query result structure
  seller_profiles?: SellerProfileSimplified; // This matches our query structure
  seller_profile?: SellerProfile; // Keep this for backward compatibility
}

// Define the Order type
export interface Order {
  id: string;
  user_id: string;
  seller_id: string;
  address_id: string;
  payment_method_id?: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  address: Address;
  customer?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  deliveries?: DeliveryProfile | DeliveryProfile[]; // Add deliveries property
}

// Define supporting types
export interface OrderItem {
  id: string;
  order_id: string;
  meal_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  subscription?: any;
  created_at: string;
  updated_at: string;
  meal?: SimplifiedMeal | Meal;
}

export interface Address {
  id: string;
  user_id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
}

// Fetch seller profile
export const getSellerProfile = async (userId: string): Promise<SellerProfile | null> => {
  try {
    console.log("Fetching seller profile for user ID:", userId);
    
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No seller profile found for user ID:', userId);
        return null;
      }
      console.error('Error fetching seller profile:', error);
      return null;
    }
    
    console.log("Found seller profile:", data);
    
    // Create a complete profile with all required fields
    const profile: SellerProfile = {
      id: data.id,
      user_id: data.user_id,
      business_name: data.business_name,
      business_description: data.business_description || '',
      cuisine_types: data.cuisine_types || [],
      service_areas: data.service_areas || {},
      cover_image_url: data.cover_image_url || '',
      gallery_images: data.gallery_images || [],
      average_rating: data.rating || 0,
      rating_count: data.rating_count || 0,
      verified: data.verification_status === 'approved',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      availability: data.availability || {},
      commission_rate: data.commission_rate || 10,
      kitchen_open: data.kitchen_open !== null ? Boolean(data.kitchen_open) : false,
      verification_status: data.verification_status || 'pending',
      social_media: data.social_media || {},
      special_diets: data.special_diets || [],
      is_active: data.is_active !== null ? data.is_active : true,
      is_promoted: data.is_promoted || false
    };
    
    return profile;
  } catch (error) {
    console.error('Error in getSellerProfile:', error);
    return null;
  }
};

// Update seller profile
export const updateSellerProfile = async (
  userId: string, 
  profileData: Partial<SellerProfile>
): Promise<SellerProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('seller_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error || !data) {
      console.error('Error updating seller profile:', error);
      return null;
    }
    
    // Create a complete profile with all required fields
    const updatedProfile: SellerProfile = {
      id: data.id,
      user_id: data.user_id,
      business_name: data.business_name,
      business_description: data.business_description || '',
      cuisine_types: data.cuisine_types || [],
      service_areas: data.service_areas || {},
      cover_image_url: data.cover_image_url || '',
      gallery_images: data.gallery_images || [],
      average_rating: data.rating || 0,
      rating_count: data.rating_count || 0,
      verified: data.verification_status === 'approved',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      availability: data.availability || {},
      commission_rate: data.commission_rate || 10,
      kitchen_open: data.kitchen_open !== null ? Boolean(data.kitchen_open) : false,
      verification_status: data.verification_status || 'pending',
      social_media: data.social_media || {},
      special_diets: data.special_diets || [],
      is_active: data.is_active !== null ? data.is_active : true,
      is_promoted: data.is_promoted || false
    };
    
    return updatedProfile;
  } catch (error) {
    console.error('Error in updateSellerProfile:', error);
    return null;
  }
};

// Get meals by seller ID
export const getMealsBySellerId = async (userId: string): Promise<Meal[]> => {
  try {
    // First, get the seller profile ID from the user_id
    const { data: sellerProfile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('id, verification_status')
      .eq('user_id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching seller profile for meals:', profileError);
      return [];
    }
    
    if (!sellerProfile) {
      console.log('No seller profile found for this user');
      return [];
    }
    
    // Check if seller is verified
    if (sellerProfile.verification_status !== 'approved') {
      console.log('Seller is not verified, cannot fetch meals');
      return [];
    }
    
    // Now fetch meals using the seller profile ID
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('seller_id', sellerProfile.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching seller meals:', error);
      return [];
    }
    
    return data as Meal[];
  } catch (error) {
    console.error('Error in getMealsBySellerId:', error);
    return [];
  }
};

// Get meal by ID
export const getMealById = async (mealId: string): Promise<Meal | null> => {
  try {
    console.log('Fetching meal with ID:', mealId);
    
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        seller_profiles:seller_id(
          id,
          business_name,
          business_description,
          verification_status,
          kitchen_open
        )
      `)
      .eq('id', mealId)
      .single();
      
    if (error || !data) {
      console.error('Error fetching meal:', error);
      return null;
    }
    
    console.log('Meal data retrieved:', data);
    return data as unknown as Meal;
  } catch (error) {
    console.error('Error in getMealById:', error);
    return null;
  }
};

// Create a new meal
export const createMeal = async (mealData: Partial<Meal>): Promise<Meal | null> => {
  try {
    // First, check if the seller has a profile
    const userId = mealData.seller_id;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log("Getting seller profile for user ID:", userId);
    
    // Get the seller profile first to use its ID as the foreign key
    const sellerProfile = await getSellerProfile(userId);
    if (!sellerProfile) {
      throw new Error('No seller profile found. Please create a seller profile first.');
    }
    
    console.log("Found seller profile with ID:", sellerProfile.id);
    
    // Ensure required fields are present
    if (!mealData.name) {
      throw new Error('Meal name is required');
    }
    
    if (!mealData.price_single && mealData.price_single !== 0) {
      throw new Error('Meal price is required');
    }
    
    // Create mealInsertData with required fields and use seller profile ID
    const mealInsertData = {
      name: mealData.name,
      price_single: mealData.price_single,
      seller_id: sellerProfile.id, // Use profile ID not user ID
      // Add other fields from mealData
      description: mealData.description || '',
      price_weekly: mealData.price_weekly,
      price_monthly: mealData.price_monthly,
      discount_percent: mealData.discount_percent || 0,
      dietary_info: mealData.dietary_info || {},
      nutritional_info: mealData.nutritional_info || {},
      preparation_time: mealData.preparation_time,
      available_days: mealData.available_days || {},
      max_orders_per_day: mealData.max_orders_per_day,
      available_quantity: mealData.available_quantity,
      is_featured: mealData.is_featured ?? false,
      is_active: mealData.is_active ?? true,
      ingredients: mealData.ingredients || [],
      category: mealData.category || 'General',
      cuisine_type: mealData.cuisine_type || '',
      tags: mealData.tags || [],
      images: mealData.images || []
    };
    
    console.log("Inserting meal with data:", mealInsertData);
    
    const { data, error } = await supabase
      .from('meals')
      .insert(mealInsertData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating meal:', error);
      throw new Error('Failed to create meal');
    }
    
    return data as Meal;
  } catch (error) {
    console.error('Error in createMeal:', error);
    throw error;
  }
};

// Update meal
export const updateMeal = async (mealId: string, mealData: Partial<Meal>): Promise<Meal | null> => {
  try {
    console.log('Updating meal with ID:', mealId);
    console.log('Update data:', mealData);
    
    // First, verify the meal exists and get the seller ID
    const { data: existingMeal, error: fetchError } = await supabase
      .from('meals')
      .select('seller_id')
      .eq('id', mealId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching meal for update:', fetchError);
      throw new Error('Meal not found or you do not have permission to update it');
    }
    
    // Now update the meal
    const { data, error } = await supabase
      .from('meals')
      .update(mealData)
      .eq('id', mealId)
      .select()
      .single();
      
    if (error || !data) {
      console.error('Error updating meal:', error);
      throw new Error('Failed to update meal');
    }
    
    console.log('Meal updated successfully:', data);
    return data as Meal;
  } catch (error) {
    console.error('Error in updateMeal:', error);
    throw error;
  }
};

// Delete meal
export const deleteMeal = async (mealId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);
      
    if (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteMeal:', error);
    return false;
  }
};

// Fetch seller orders
export const getSellerOrders = async (sellerId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          meal:meal_id(name, price_single, images)
        ),
        address:address_id(*)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching seller orders:', error);
      return [];
    }
    
    // Fetch customer profiles for each order
    const orders = data as unknown as Order[];
    
    // Get unique user IDs
    const userIds = [...new Set(orders.map(order => order.user_id))];
    
    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching customer profiles:', profilesError);
    } else if (profiles) {
      // Create a map of user profiles
      const userProfiles: Record<string, { first_name: string; last_name: string; phone?: string }> = {};
      profiles.forEach(profile => {
        userProfiles[profile.id] = {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone
        };
      });
      
      // Add customer info to each order
      orders.forEach(order => {
        order.customer = userProfiles[order.user_id] || { first_name: 'Unknown', last_name: 'Customer' };
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error in getSellerOrders:', error);
    return [];
  }
};

// Get seller analytics
export const getSellerAnalytics = async (sellerId: string): Promise<SellerAnalytics> => {
  try {
    // Get total meals count
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .select('id', { count: 'exact' })
      .eq('seller_id', sellerId);
      
    const totalMeals = mealsData?.length || 0;
    
    // Get order statistics
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total')
      .eq('seller_id', sellerId);
      
    if (ordersError) throw ordersError;
    
    const orders = ordersData || [];
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Calculate total revenue (from completed orders)
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);
      
    return {
      total_meals: totalMeals,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: totalRevenue
    };
  } catch (error) {
    console.error('Error in getSellerAnalytics:', error);
    return {
      total_meals: 0,
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0
    };
  }
};

// React Query hooks
export const useMeals = () => {
  return useQuery({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          seller_profiles:seller_id (
            id,
            business_name,
            business_description,
            verification_status,
            kitchen_open
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filter to include only meals from verified sellers with open kitchens
      const validMeals = data.filter(meal => 
        meal.seller_profiles && 
        typeof meal.seller_profiles === 'object' &&
        !('error' in meal.seller_profiles) &&
        'verification_status' in meal.seller_profiles &&
        'kitchen_open' in meal.seller_profiles &&
        meal.seller_profiles.verification_status !== 'rejected' &&
        meal.seller_profiles.kitchen_open === true
      );
      
      return validMeals as unknown as Meal[];
    }
  });
};

export const useFeaturedMeals = () => {
  return useQuery({
    queryKey: ['featuredMeals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          seller_profiles:seller_id (
            id,
            business_name,
            verification_status,
            kitchen_open
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filter to include only meals from verified sellers with open kitchens
      const validMeals = data.filter(meal => 
        meal.seller_profiles && 
        typeof meal.seller_profiles === 'object' &&
        !('error' in meal.seller_profiles) &&
        'verification_status' in meal.seller_profiles &&
        'kitchen_open' in meal.seller_profiles &&
        meal.seller_profiles.verification_status !== 'rejected' &&
        meal.seller_profiles.kitchen_open === true
      );
      
      return validMeals as unknown as Meal[];
    }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('category')
        .not('category', 'is', null);
        
      if (error) throw error;
      
      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category))];
      return categories.filter(Boolean);
    }
  });
};

export const useCuisineTypes = () => {
  return useQuery({
    queryKey: ['cuisineTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('cuisine_type')
        .not('cuisine_type', 'is', null);
        
      if (error) throw error;
      
      // Extract unique cuisine types
      const cuisineTypes = [...new Set(data.map(item => item.cuisine_type))];
      return cuisineTypes.filter(Boolean);
    }
  });
};

// Search meals by query
export const searchMeals = async (query: string): Promise<Meal[]> => {
  try {
    if (!query || query.trim() === '') {
      // If empty query, return all active meals
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          seller_profiles:seller_id (
            id,
            business_name,
            verification_status,
            kitchen_open
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching meals:', error);
        return [];
      }
      
      // Filter valid meals
      const validMeals = data.filter(meal => 
        meal.seller_profiles && 
        typeof meal.seller_profiles === 'object' &&
        !('error' in meal.seller_profiles) &&
        'verification_status' in meal.seller_profiles &&
        'kitchen_open' in meal.seller_profiles &&
        meal.seller_profiles.verification_status !== 'rejected' &&
        meal.seller_profiles.kitchen_open === true
      );
      
      return validMeals as Meal[];
    }
    
    // Otherwise search by query
    const searchQuery = query.toLowerCase();
    
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        seller_profiles:seller_id (
          id,
          business_name,
          verification_status,
          kitchen_open
        )
      `)
      .eq('is_active', true)
      .or(`
        name.ilike.%${searchQuery}%,
        description.ilike.%${searchQuery}%,
        cuisine_type.ilike.%${searchQuery}%
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error searching meals:', error);
      return [];
    }
    
    // Filter valid meals
    const validMeals = data.filter(meal => 
      meal.seller_profiles && 
      typeof meal.seller_profiles === 'object' &&
      !('error' in meal.seller_profiles) &&
      'verification_status' in meal.seller_profiles &&
      'kitchen_open' in meal.seller_profiles &&
      meal.seller_profiles.verification_status !== 'rejected' &&
      meal.seller_profiles.kitchen_open === true
    );
    
    return validMeals as Meal[];
  } catch (error) {
    console.error('Error in searchMeals:', error);
    return [];
  }
};
