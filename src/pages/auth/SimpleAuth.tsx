import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { checkUserProfile, saveUserProfile } from '@/services/profileService';

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
    console.log("Auth state in SimpleAuth:", { user, loading, step, isTestUser });
    
    if (!loading && user) {
      const checkUserSetup = async () => {
        setCheckingUserData(true);
        
        try {
          // Check if user has a complete profile
          const profileResult = await checkUserProfile(user.id);
          console.log("Profile check result:", profileResult);
          
          if (profileResult.isComplete) {
            // Existing user with complete profile - redirect based on role
            console.log("Complete profile detected, redirecting to dashboard");
            
            if (user.role === 'seller') {
              navigate('/seller/dashboard', { replace: true });
            } else if (user.role === 'captain') {
              navigate('/captain/dashboard', { replace: true });
            } else {
              navigate(redirect, { replace: true });
            }
          } else if (profileResult.exists) {
            // Profile exists but incomplete - determine what step to show
            if (!user.role) {
              console.log("User exists but needs role selection");
              setStep('role');
            } else {
              console.log("User with role needs profile completion");
              setSelectedRole(user.role as UserRole);
              setStep('profile');
            }
          } else {
            // New user - show role selection
            console.log("New user detected, showing role selection");
            setStep('role');
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
          setStep('role'); // Default to role selection on error
        } finally {
          setCheckingUserData(false);
        }
      };
      
      checkUserSetup();
    }
  }, [user, loading, navigate, redirect]);
  
  // When phone verification is successful
  const handleLoginSuccess = async () => {
    setCheckingUserData(true);
    await refreshUser();
    
    if (!user) {
      console.error("No user after login success, this shouldn't happen");
      setCheckingUserData(false);
      return;
    }
    
    try {
      // Check if user already exists in database with complete profile
      const profileResult = await checkUserProfile(user.id);
      console.log("Profile check result after login:", profileResult);
      
      if (profileResult.isComplete) {
        // User exists with complete profile - redirect based on role
        if (user.role === 'seller') {
          navigate('/seller/dashboard', { replace: true });
        } else if (user.role === 'captain') {
          navigate('/captain/dashboard', { replace: true });
        } else {
          navigate(redirect, { replace: true });
        }
      } else if (profileResult.exists && user.role) {
        // Profile exists but incomplete with role - go to profile step
        setSelectedRole(user.role as UserRole);
        setStep('profile');
      } else {
        // No complete profile or no role - go to role selection
        setStep('role');
      }
    } catch (error) {
      console.error("Error in profile check:", error);
      setStep('role'); // Default to role selection on error
    } finally {
      setCheckingUserData(false);
    }
  };
  
  // When role is selected
  const handleRoleSelected = async (role: UserRole) => {
    console.log("Role selected:", role);
    setSelectedRole(role);
    
    if (!user) {
      console.error("No user when role selected, this shouldn't happen");
      return;
    }
    
    try {
      // Update user role in profile
      await saveUserProfile(user.id, { role });
      
      // Refresh user data to get updated role
      await refreshUser();
      
      // Continue to profile setup
      setStep('profile');
    } catch (error) {
      console.error("Error updating role:", error);
      // Continue to profile setup anyway
      setStep('profile');
    }
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
