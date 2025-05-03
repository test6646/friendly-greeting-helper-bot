
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import SellerAnalytics from '@/components/seller/SellerAnalytics';
import SellerMeals from '@/components/seller/SellerMeals';
import SellerOrders from '@/components/seller/SellerOrders';
import SellerOverview from '@/components/seller/SellerOverview';
import DashboardLoading from '@/components/seller/DashboardLoading';
import NoSellerProfileMessage from '@/components/seller/NoSellerProfileMessage';
import VerificationWarning from '@/components/seller/VerificationWarning';
import DashboardHeader from '@/components/seller/DashboardHeader';
import { useSellerProfile } from '@/components/seller/hooks/useSellerProfile';
import { useSellerOrderNotifications } from '@/components/seller/hooks/useSellerOrderNotifications';

const SellerDashboard = () => {
  const { user } = useAuth();
  const { loading, hasSellerProfile, sellerProfile } = useSellerProfile(user?.id);
  
  // Set up real-time notification listeners if we have a seller profile
  useSellerOrderNotifications(sellerProfile?.id);
  
  if (loading) {
    return (
      <Layout>
        <DashboardLoading />
      </Layout>
    );
  }

  // If user doesn't have a seller profile, show creation message
  if (!hasSellerProfile) {
    return (
      <Layout>
        <NoSellerProfileMessage />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Add Sonner Toaster for notifications */}
      <Toaster position="top-right" richColors />
      
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader />
        <VerificationWarning sellerProfile={sellerProfile} />
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meals">My Meals</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <SellerOverview sellerId={user?.id} sellerProfile={sellerProfile} />
          </TabsContent>
          
          <TabsContent value="meals" className="space-y-6">
            <SellerMeals sellerId={user?.id} />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-6">
            <SellerOrders sellerId={user?.id} />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <SellerAnalytics sellerId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SellerDashboard;
