
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpiceButton } from '@/components/ui/spice-button';
import { AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface SellerDashboardLayoutProps {
  loading: boolean;
  hasSellerProfile: boolean;
  sellerProfile: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const SellerDashboardLayout: React.FC<SellerDashboardLayoutProps> = ({
  loading,
  hasSellerProfile,
  sellerProfile,
  activeTab,
  setActiveTab,
  children
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading seller dashboard...</div>
      </div>
    );
  }

  // If user doesn't have a seller profile, redirect to create profile
  if (!hasSellerProfile) {
    return (
      <div className="py-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="h-12 w-12 mx-auto text-yellow-500 mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Seller Profile Required</h2>
            <p className="text-yellow-700 mb-6">
              You need to create a seller profile before you can access the dashboard and add meals.
            </p>
            <SpiceButton 
              onClick={() => navigate('/seller/create-profile')}
              className="bg-saffron hover:bg-saffron/90 text-white"
            >
              Create Seller Profile
            </SpiceButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600">Manage your meals and track your business</p>
        </div>
        
        <SpiceButton
          onClick={() => navigate('/seller/add-meal')}
          className="bg-saffron hover:bg-saffron/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Meal
        </SpiceButton>
      </div>
      
      {sellerProfile && sellerProfile.verification_status !== 'approved' && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Verification Pending</h3>
                <p className="text-sm text-yellow-700">
                  Your seller profile is awaiting verification. Some features may be limited until verification is complete.
                  <SpiceButton 
                    variant="ghost" 
                    className="p-0 h-auto text-saffron ml-2"
                    onClick={() => navigate('/seller/verification')}
                  >
                    Complete verification
                  </SpiceButton>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meals">My Meals</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerDashboardLayout;
