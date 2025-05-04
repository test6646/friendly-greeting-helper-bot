
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { checkUserProfile, saveUserProfile } from '@/services/profileService';
import { toast } from '@/components/ui/use-toast';

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
    
    try {
      // Wait for the user context to be actually updated
      setTimeout(async () => {
        const currentUser = user; // Get fresh user data
        console.log("Current user after login success:", currentUser);
        
        if (!currentUser) {
          console.error("No user after login success and refresh");
          setCheckingUserData(false);
          return;
        }
        
        try {
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
      }, 300); // Give it a moment to update context
    } catch (error) {
      console.error("Unexpected error in handleLoginSuccess:", error);
      setCheckingUserData(false);
      setStep('role'); // Default to role selection on error
    }
  };
  
  // When role is selected
  const handleRoleSelected = async (role: UserRole) => {
    console.log("Role selected:", role, "User ID:", user?.id);
    setSelectedRole(role);
    
    if (!user) {
      console.error("No user when role selected, this shouldn't happen");
      return;
    }
    
    try {
      // Update user role in profile
      await saveUserProfile(user.id, { role });
      console.log("User role updated to:", role);
      
      // Refresh user data to get updated role
      await refreshUser();
      console.log("User data refreshed after role update");
      
      // Show toast message
      toast({
        title: "Role Selected",
        description: `You've selected the ${role} role. Now let's complete your profile.`,
      });
      
      // Continue to profile setup
      setStep('profile');
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to save your role. Please try again.",
        variant: "destructive",
      });
      // Continue to profile setup anyway
      setStep('profile');
    }
  };
  
  // When profile setup is complete
  const handleProfileSuccess = async () => {
    await refreshUser();
    
    // Show success toast
    toast({
      title: "Profile Complete",
      description: "Your profile has been set up successfully.",
    });
    
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4 mx-auto" />
            <p className="text-lg font-medium">Loading your account...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout hideNavbar hideFooter>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {step === 'login' ? 'Sign in to SheKaTiffin' : 
               step === 'role' ? 'Choose Your Role' : 
               'Complete Your Profile'}
            </h1>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mx-auto sm:max-w-md">
              {step === 'login' ? 'Get started with delicious homemade food' : 
               step === 'role' ? 'Let us know how you want to use SheKaTiffin' : 
               'Just a few more details to get you started'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
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
      </div>
    </Layout>
  );
};

export default SimpleAuth;
