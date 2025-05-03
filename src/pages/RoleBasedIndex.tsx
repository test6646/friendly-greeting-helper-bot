
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import CustomerHomePage from './home/CustomerHomePage';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedIndex: React.FC = () => {
  const { user, loading, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in RoleBasedIndex:", { user, loading });
    
    // Force a profile refresh when component mounts, but only if user exists
    if (!loading && user) {
      refreshUser();
    }
  }, [loading, user, refreshUser]);

  useEffect(() => {
    // Direct dashboard navigation based on user role
    if (!loading && user) {
      // Log the current user information to debug
      console.log("Current user in RoleBasedIndex:", user);
      
      // Check if user has default names, which indicates a first-time user
      const isFirstTimeUser = 
        (user.first_name === 'New' || !user.first_name) || 
        (user.last_name === 'User' || !user.last_name) ||
        !user.role;
      
      if (isFirstTimeUser) {
        console.log("First-time user detected, redirecting to auth flow");
        navigate('/auth', { replace: true });
        return;
      }
      
      // If user doesn't have a role yet, send to role selection
      if (!user.role) {
        console.log("User missing role, redirecting to auth flow");
        navigate('/auth', { replace: true });
        return;
      }
      
      if (user.role === 'seller') {
        console.log("Redirecting to seller dashboard");
        navigate('/seller/dashboard', { replace: true });
      } else if (user.role === 'captain') {
        console.log("Redirecting to captain dashboard");
        navigate('/captain/dashboard', { replace: true });
      }
      // For customers, we'll render CustomerHomePage
    }
  }, [user, loading, navigate]);
  
  // If not authenticated and not loading, redirect to auth page
  if (!loading && !user) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" replace />;
  }
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-32 w-full max-w-md" />
          <div className="animate-pulse text-primary">Loading user information...</div>
        </div>
      </Layout>
    );
  }

  // Show customer home page for authenticated customers with proper role
  return (
    <Layout>
      <CustomerHomePage />
    </Layout>
  );
};

export default RoleBasedIndex;
