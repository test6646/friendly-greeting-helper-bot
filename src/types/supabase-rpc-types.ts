
// Type definitions for custom RPC functions
import { PostgrestResponse } from '@supabase/supabase-js';

export interface CaptainProfileRPC {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_registration: string;
  service_areas: any;
  availability_schedule: any;
  is_active: boolean;
  is_available: boolean;
  current_location: any;
  verification_status: string;
  average_rating: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

// This helps TypeScript understand the return types of our RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: 'get_captain_profile_by_user_id',
      params: { p_user_id: string }
    ): Promise<PostgrestResponse<CaptainProfileRPC[]>>;
    
    rpc<T = any>(
      fn: 'update_captain_availability',
      params: { p_user_id: string; p_is_available: boolean }
    ): Promise<PostgrestResponse<boolean>>;
    
    rpc<T = any>(
      fn: 'update_captain_vehicle_info',
      params: { 
        p_user_id: string;
        p_vehicle_type?: string;
        p_vehicle_registration?: string;
      }
    ): Promise<PostgrestResponse<boolean>>;
    
    rpc<T = any>(
      fn: 'create_captain_notification',
      params: { 
        p_captain_id: string;
        p_title: string;
        p_message: string;
        p_related_entity_id?: string | null;
      }
    ): Promise<PostgrestResponse<any>>;
  }
}
