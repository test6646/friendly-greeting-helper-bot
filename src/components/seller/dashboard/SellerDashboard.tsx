
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SellerDashboardLayout from './SellerDashboardLayout';
import SellerOverviewTab from './tabs/SellerOverviewTab';
import SellerMealsTab from './tabs/SellerMealsTab';
import SellerOrdersTab from './tabs/SellerOrdersTab';
import SellerAnalyticsTab from './tabs/SellerAnalyticsTab';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasSellerProfile, setHasSellerProfile] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkSellerProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log("Checking seller profile for user:", user.id);
        
        // Check for seller profile using user_id
        const { data, error } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('user_id', user.id)
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
  }, [user, toast]);
  
  // Render appropriate content based on active tab
  const renderTabContent = () => {
    if (!user) return null;
    
    switch (activeTab) {
      case 'overview':
        return <SellerOverviewTab sellerId={user.id} sellerProfile={sellerProfile} />;
      case 'meals':
        return <SellerMealsTab sellerId={user.id} />;
      case 'orders':
        return <SellerOrdersTab sellerId={user.id} />;
      case 'analytics':
        return <SellerAnalyticsTab sellerId={user.id} />;
      default:
        return <SellerOverviewTab sellerId={user.id} sellerProfile={sellerProfile} />;
    }
  };

  return (
    <SellerDashboardLayout
      loading={loading}
      hasSellerProfile={hasSellerProfile}
      sellerProfile={sellerProfile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderTabContent()}
    </SellerDashboardLayout>
  );
};

export default SellerDashboard;
