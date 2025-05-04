
import { supabase } from '@/integrations/supabase/client';

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
    console.log("Checking profile for user ID:", userId);
    
    // Check if this is a test user ID
    const isTestUser = userId.startsWith('test-');
    
    if (isTestUser) {
      // For test users, check localStorage first
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          
          // Check if test user has a complete profile
          const isComplete = 
            userData.first_name && 
            userData.first_name !== 'New' &&
            userData.last_name && 
            userData.last_name !== 'User' &&
            userData.role;
            
          console.log("Test user profile check:", { isComplete, userData });
          
          return { 
            exists: true, 
            isComplete, 
            profile: userData, 
            error: null 
          };
        } catch (error) {
          console.error("Error parsing test user data:", error);
        }
      }
      
      return { exists: false, isComplete: false, profile: null, error: null };
    }
    
    // For real users, check the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
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
    
    console.log("Profile check result:", { 
      exists: true, 
      isComplete,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role
    });
    
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
    // Check if this is a test user ID
    const isTestUser = userId.startsWith('test-');
    
    if (isTestUser) {
      // For test users, check localStorage
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          return userData;
        } catch (error) {
          console.error("Error parsing test user data:", error);
          return null;
        }
      }
      return null;
    }
    
    // For real users, check the database
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

/**
 * Create or update a user profile in the database
 * @param userId User ID
 * @param profileData Profile data to save
 * @returns Created/updated profile or null if failed
 */
export const saveUserProfile = async (userId: string, profileData: Record<string, any>) => {
  try {
    // For test users, save to localStorage and also to the database if possible
    const isTestUser = userId.startsWith('test-');
    
    if (isTestUser) {
      // Save to localStorage for test users
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          const updatedData = { ...userData, ...profileData };
          localStorage.setItem('test_mode_user', JSON.stringify(updatedData));
          console.log("Test user profile saved to localStorage:", updatedData);
        } catch (error) {
          console.error("Error updating test user data:", error);
        }
      }
    }
    
    // For all users (including test users), attempt to save to the database
    console.log("Saving profile to database for user:", userId, profileData);
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing profile:", checkError);
      return null;
    }
    
    let result;
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating profile:", error);
        return null;
      }
      
      result = data;
      console.log("Profile updated successfully:", data);
    } else {
      // Create new profile - ensure we have the required fields
      const newProfileData = {
        id: userId,
        first_name: profileData.first_name || 'New',
        last_name: profileData.last_name || 'User',
        ...profileData
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating profile:", error);
        return null;
      }
      
      result = data;
      console.log("Profile created successfully:", data);
    }
    
    return result;
  } catch (error) {
    console.error("Unexpected error saving profile:", error);
    return null;
  }
};
