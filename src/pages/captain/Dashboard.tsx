
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { initializeOrderStatusListener } from '@/services/enhancedNotificationService';
import CaptainDashboard from '@/components/captain/dashboard/CaptainDashboard';
import { Toaster } from '@/components/ui/sonner';

const CaptainDashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not logged in or not a captain
    if (!loading && (!user || user.role !== 'captain')) {
      navigate('/auth?redirect=/captain/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Display welcome toast when dashboard loads
    if (!loading && user?.role === 'captain') {
      toast.info('Welcome to your dashboard!', {
        description: 'You will receive notifications for new delivery requests here.'
      });
      
      // Initialize order status listener to ensure it's running
      console.log("Initializing order status listener from dashboard");
      initializeOrderStatusListener();
      
      // DEBUG: Log authentication status
      console.log("Captain authenticated:", {
        userId: user?.id,
        role: user?.role,
        email: user?.email
      });
    }
  }, [loading, user]);
  
  if (loading) {
    return (
      <Layout>
        <div className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Add Toaster for notifications */}
      <Toaster position="top-right" richColors />
      
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <CaptainDashboard />
      </div>
    </Layout>
  );
};

export default CaptainDashboardPage;
