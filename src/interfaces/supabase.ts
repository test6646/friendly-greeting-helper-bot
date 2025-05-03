
// Add additional type definitions for Supabase tables
import { Json } from '@/integrations/supabase/types';

export interface SellerProfileDB {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  cuisine_types: string[] | null;
  service_areas: Json | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  rating: number | null;
  rating_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  availability: Json | null;
  commission_rate: number | null;
  verification_status: string | null;
  social_media: Json | null;
  special_diets: string[] | null;
  is_active: boolean | null;
  is_promoted: boolean | null;
  kitchen_open: boolean | null;
}

export interface SellerProfileExtended {
  kitchen_open: boolean;
  average_rating: number;
  verified: boolean;
  social_media: Json | null;
  gallery_images: string[] | null;
  availability: Json | null;
  commission_rate: number | null;
  special_diets: string[] | null;
  is_promoted: boolean | null;
}

// Add a simplified version of SellerProfile that matches the query result
export interface SellerProfileSimplified {
  id: string;
  business_name: string;
  business_description: string | null;
  verification_status: string | null;
  kitchen_open: boolean | null;
}

// Add interface for seller verification
export interface SellerVerification {
  id: string;
  user_id: string;
  id_proof_url: string | null;
  address_proof_url: string | null;
  business_certificate_url: string | null;
  selfie_with_id_url: string | null;
  other_documents: Json | null;
  status: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Add interface for delivery profile
export interface DeliveryProfile {
  id: string;
  captain_id: string;
  order_id: string;
  status: string;
  delivery_notes?: string | null;
  delivery_time?: string | null;
  delivery_code?: string | null;
  delivery_proof_url?: string | null;
  customer_signature?: boolean | null;
  pickup_time?: string | null;
  distance?: number | null;
  delivery_fee: number;
  captain_rating?: number | null;
  customer_rating?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Add simplified meal interface for order items
export interface SimplifiedMeal {
  id?: string;
  name: string;
  price_single: number;
  images?: string[] | null;
  seller_id?: string;
  is_featured?: boolean;
  is_active?: boolean;
}
