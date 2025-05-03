
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const SimpleAuth: React.FC = () => {
  const [step, setStep] = useState<'login' | 'role' | 'profile'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const { user, loading, isTestUser, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in SimpleAuth:", { user, loading, step });
    
    if (!loading && user) {
      // Check if user is a new user without complete profile
      const isNewUser = 
        (user.first_name === 'New' || !user.first_name) || 
        (user.last_name === 'User' || !user.last_name) ||
        !user.role;
      
      if (isNewUser) {
        // New user needs to select role and complete profile
        console.log("New user detected, showing role selection");
        setStep('role');
      } else if (user.role) {
        // If user has a complete profile (with role), redirect
        console.log("User has role, redirecting to:", redirect);
        navigate(redirect, { replace: true });
      } else {
        // If user is authenticated but missing role, show role selection
        console.log("User authenticated but missing role, showing role selection");
        setStep('role');
      }
    }
  }, [user, loading, navigate, redirect]);
  
  // When phone verification is successful
  const handleLoginSuccess = async () => {
    await refreshUser();
    // Check if user is a new user without complete profile
    const isNewUser = 
      !user?.first_name || user?.first_name === 'New' || 
      !user?.last_name || user?.last_name === 'User' ||
      !user?.role;
    
    if (isNewUser) {
      setStep('role');
    } else if (user?.role) {
      navigate(redirect, { replace: true });
    } else {
      setStep('role');
    }
  };
  
  // When role is selected
  const handleRoleSelected = (role: UserRole) => {
    console.log("Role selected:", role);
    setSelectedRole(role);
    setStep('profile');
  };
  
  // When profile setup is complete
  const handleProfileSuccess = async () => {
    await refreshUser();
    
    // Redirect based on role
    if (selectedRole === 'seller') {
      navigate('/seller/dashboard', { replace: true });
    } else if (selectedRole === 'captain') {
      navigate('/captain/dashboard', { replace: true });
    } else {
      navigate(redirect, { replace: true });
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Layout hideNavbar hideFooter>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout hideNavbar hideFooter>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            {step === 'login' ? 'Welcome to SheKaTiffin' : 
             step === 'role' ? 'Choose Your Role' : 
             'Complete Your Profile'}
          </h1>
          
          {step === 'login' && (
            <PhoneLoginForm onSuccess={handleLoginSuccess} />
          )}
          
          {step === 'role' && (
            <RoleSelectionForm onSelect={handleRoleSelected} initialRole={selectedRole} />
          )}
          
          {step === 'profile' && (
            <ProfileSetupForm 
              role={selectedRole} 
              onSuccess={handleProfileSuccess}
              isTestUser={isTestUser}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SimpleAuth;
