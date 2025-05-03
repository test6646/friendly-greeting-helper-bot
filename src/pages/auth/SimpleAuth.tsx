
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
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
          
          // User with complete profile (has first name, last name, and role)
          if (profileResult.isComplete) {
            console.log("Complete profile detected, redirecting to dashboard");
            
            if (user.role === 'seller') {
              navigate('/seller/dashboard', { replace: true });
            } else if (user.role === 'captain') {
              navigate('/captain/dashboard', { replace: true });
            } else {
              navigate(redirect, { replace: true });
            }
          } 
          // User exists but incomplete profile (missing first name, last name, or role)
          else if (profileResult.exists) {
            if (!user.role) {
              console.log("User exists but needs role selection");
              setStep('role');
            } else {
              console.log("User with role needs profile completion");
              setSelectedRole(user.role as UserRole);
              setStep('profile');
            }
          } 
          // New user
          else {
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
    console.log("Login success callback triggered");
    setCheckingUserData(true);
    
    // Refresh user data to get latest state
    try {
      await refreshUser();
      console.log("User data refreshed after login");
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
    
    // Get the latest user data after refresh
    const currentUser = useSimpleAuth().user;
    console.log("Current user after refresh:", currentUser);
    
    try {
      if (!currentUser) {
        console.error("No user after login success and refresh");
        setCheckingUserData(false);
        // If no user, stay on login page
        return;
      }
      
      // Check if user already exists in database with complete profile
      const profileResult = await checkUserProfile(currentUser.id);
      console.log("Profile check result after login:", profileResult);
      
      if (profileResult.isComplete) {
        // User exists with complete profile - redirect based on role
        if (currentUser.role === 'seller') {
          navigate('/seller/dashboard', { replace: true });
        } else if (currentUser.role === 'captain') {
          navigate('/captain/dashboard', { replace: true });
        } else {
          navigate(redirect, { replace: true });
        }
      } else if (profileResult.exists && currentUser.role) {
        // Profile exists but incomplete with role - go to profile step
        setSelectedRole(currentUser.role as UserRole);
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
