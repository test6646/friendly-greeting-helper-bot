import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

const SimpleAuth: React.FC = () => {
  const [step, setStep] = useState<'login' | 'role' | 'profile'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const { user, loading, isTestUser, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [checkingUserData, setCheckingUserData] = useState(false);
  
  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in SimpleAuth:", { user, loading, step });
    
    if (!loading && user) {
      // Check if user is a new user without complete profile
      const isExistingUser = user.first_name !== 'New' && 
                            user.last_name !== 'User' && 
                            user.role !== null && 
                            user.role !== undefined;
      
      console.log("User exists check:", { isExistingUser, user });
      
      if (isExistingUser) {
        // Existing user with complete profile - redirect based on role
        if (user.role === 'seller') {
          navigate('/seller/dashboard', { replace: true });
        } else if (user.role === 'captain') {
          navigate('/captain/dashboard', { replace: true });
        } else {
          navigate(redirect, { replace: true });
        }
      } else {
        // New user - show role selection
        console.log("New user detected, showing role selection");
        setStep('role');
      }
    }
  }, [user, loading, navigate, redirect]);
  
  // When phone verification is successful
  const handleLoginSuccess = async () => {
    setCheckingUserData(true);
    await refreshUser();
    
    // Check if user already exists in database with complete profile
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', user?.id)
        .single();
      
      console.log("Profile fetch result:", { profile, error });
      
      if (error) {
        console.error("Error fetching profile:", error);
        setStep('role');
      } else if (profile) {
        const isCompleteProfile = 
          profile.first_name !== 'New' && 
          profile.last_name !== 'User' && 
          profile.role !== null;
        
        if (isCompleteProfile) {
          // User exists with complete profile - redirect based on role
          if (profile.role === 'seller') {
            navigate('/seller/dashboard', { replace: true });
          } else if (profile.role === 'captain') {
            navigate('/captain/dashboard', { replace: true });
          } else {
            navigate(redirect, { replace: true });
          }
        } else {
          // User exists but incomplete profile - show role selection
          setStep('role');
        }
      } else {
        // No profile found, show role selection
        setStep('role');
      }
    } catch (error) {
      console.error("Error in profile check:", error);
      setStep('role');
    } finally {
      setCheckingUserData(false);
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
  if (loading || checkingUserData) {
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
