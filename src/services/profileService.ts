
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Interface for complete profile check result
export interface ProfileCheckResult {
  exists: boolean;
  isComplete: boolean;
  profile: any | null;
  error: any | null;
}

/**
 * Checks if a user profile exists and is complete
 * @param userId User ID to check
 * @returns Object containing profile status
 */
export const checkUserProfile = async (userId: string): Promise<ProfileCheckResult> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return { exists: false, isComplete: false, profile: null, error };
    }
    
    // Check if profile exists
    if (!profile) {
      return { exists: false, isComplete: false, profile: null, error: null };
    }
    
    // Check if profile is complete (not default values)
    const isComplete = 
      profile.first_name !== 'New' && 
      profile.first_name !== null &&
      profile.last_name !== 'User' && 
      profile.last_name !== null &&
      profile.role !== null;
    
    return { 
      exists: true, 
      isComplete, 
      profile, 
      error: null 
    };
  } catch (error) {
    console.error("Unexpected error checking profile:", error);
    return { exists: false, isComplete: false, profile: null, error };
  }
};

/**
 * Get profile data for a user
 * @param userId User ID to look up
 * @returns Profile data or null if not found
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};
