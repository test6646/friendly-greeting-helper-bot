
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSellerProfile(userId: string | undefined) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasSellerProfile, setHasSellerProfile] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    const checkSellerProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        console.log("Checking seller profile for user:", userId);
        
        // Check if this is a test user
        const isTestUser = userId.startsWith('test-');
        
        if (isTestUser) {
          // For test users, check localStorage first
          const testModeUser = localStorage.getItem('test_mode_user');
          if (testModeUser) {
            try {
              const userData = JSON.parse(testModeUser);
              // Check if this test user has seller role
              if (userData.role === 'seller') {
                console.log("Test user has seller role");
                
                // Try to get seller profile from database first
                const { data: dbProfile, error: dbError } = await supabase
                  .from('seller_profiles')
                  .select('*')
                  .eq('user_id', userId)
                  .single();
                  
                if (!dbError && dbProfile) {
                  console.log("Found seller profile in database for test user:", dbProfile);
                  setHasSellerProfile(true);
                  setSellerProfile(dbProfile);
                } else {
                  console.log("No seller profile found in database for test user, creating one");
                  
                  // Create a new seller profile in the database
                  const { data: newProfile, error: createError } = await supabase
                    .from('seller_profiles')
                    .insert({
                      user_id: userId,
                      business_name: userData.business_name || "Test Kitchen",
                      business_description: userData.business_description || "Test kitchen description",
                      cuisine_types: [userData.cuisine_type || "Indian"],
                      verification_status: 'verified',
                      is_active: true,
                      kitchen_open: true
                    })
                    .select()
                    .single();
                    
                  if (createError) {
                    console.error("Error creating seller profile:", createError);
                    
                    // Create a simple profile object from test user data as fallback
                    const testProfile = {
                      id: `seller-${userId}`,
                      user_id: userId,
                      business_name: userData.business_name || "Test Kitchen",
                      business_description: userData.business_description || "Test kitchen description",
                      cuisine_types: [userData.cuisine_type || "Indian"],
                      verification_status: 'verified',
                      is_active: true,
                      kitchen_open: true
                    };
                    
                    setHasSellerProfile(true);
                    setSellerProfile(testProfile);
                  } else {
                    console.log("Created seller profile for test user:", newProfile);
                    setHasSellerProfile(true);
                    setSellerProfile(newProfile);
                  }
                }
              } else {
                console.log("Test user doesn't have seller role");
                setHasSellerProfile(false);
              }
            } catch (error) {
              console.error("Error parsing test user data:", error);
              setHasSellerProfile(false);
            }
          } else {
            console.log("No test user data found");
            setHasSellerProfile(false);
          }
        } else {
          // For real users, check the database
          const { data, error } = await supabase
            .from('seller_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (error) {
            if (error.code === 'PGRST116') {
              console.log("No seller profile found for this user");
              setHasSellerProfile(false);
            } else {
              console.error('Error checking seller profile:', error);
              toast({
                title: 'Error',
                description: 'Failed to load seller information',
                variant: 'destructive'
              });
            }
          } else if (data) {
            console.log("Found seller profile:", data);
            setHasSellerProfile(true);
            setSellerProfile(data);
          }
        }
        
      } catch (error) {
        console.error('Error checking seller profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load seller information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkSellerProfile();
  }, [userId, toast]);

  return {
    loading,
    hasSellerProfile,
    sellerProfile
  };
}
