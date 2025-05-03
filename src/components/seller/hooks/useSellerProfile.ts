
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
        
        // Check for seller profile using user_id
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
