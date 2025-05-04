
import { supabase } from '@/integrations/supabase/client';

// Check if a user has a profile and if it's complete
export const checkUserProfile = async (userId: string) => {
  if (!userId) {
    console.error("No user ID provided to checkUserProfile");
    return { exists: false, isComplete: false, profile: null, error: "No user ID provided" };
  }

  console.log("Checking profile for user ID:", userId);

  try {
    // Check if this is a test user (test IDs start with "test-")
    const isTestUser = userId.startsWith('test-');
    
    if (isTestUser) {
      // For test users, check localStorage instead of database
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          console.log("Test user profile check:", {
            isComplete: userData.role && userData.first_name !== 'New' && userData.last_name !== 'User' ? userData.role : false,
            userData
          });
          
          // Return user data from localStorage
          return {
            exists: true,
            isComplete: userData.role && userData.first_name !== 'New' && userData.last_name !== 'User' ? userData.role : false,
            profile: userData,
            error: null
          };
        } catch (e) {
          console.error("Error parsing test user data:", e);
          return { exists: false, isComplete: false, profile: null, error: "Invalid test user data" };
        }
      }
      return { exists: false, isComplete: false, profile: null, error: "Test user not found" };
    }
    
    // For real users, check the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return { exists: false, isComplete: false, profile: null, error: null };
      }
      throw error;
    }
    
    // Check if the profile is complete (has first name, last name, and role)
    const isComplete = 
      profile.first_name && 
      profile.first_name !== 'New' && 
      profile.last_name && 
      profile.last_name !== 'User' && 
      profile.role ? profile.role : false;
      
    return {
      exists: true,
      isComplete,
      profile,
      error: null
    };
  } catch (error) {
    console.error("Error checking user profile:", error);
    return { exists: false, isComplete: false, profile: null, error };
  }
};

// Save/update a user profile
export const saveUserProfile = async (userId: string, profileData: any) => {
  if (!userId) {
    console.error("No user ID provided to saveUserProfile");
    return null;
  }

  try {
    // Check if this is a test user (test IDs start with "test-")
    const isTestUser = userId.startsWith('test-');
    
    if (isTestUser) {
      // For test users, update localStorage instead of database
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          const updatedUser = { ...userData, ...profileData };
          localStorage.setItem('test_mode_user', JSON.stringify(updatedUser));
          console.log("Updated test user profile:", updatedUser);
          return updatedUser;
        } catch (e) {
          console.error("Error updating test user profile:", e);
          return null;
        }
      }
      return null;
    }
    
    // For real users, update the database
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return null;
  }
};
