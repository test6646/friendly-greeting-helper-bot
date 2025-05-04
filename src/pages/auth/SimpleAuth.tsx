
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import RoleSelectionForm, { UserRole } from '@/components/auth/RoleSelectionForm';
import ProfileSetupForm from '@/components/auth/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { checkUserProfile, saveUserProfile } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';

const SimpleAuth: React.FC = () => {
  const [step, setStep] = useState<'login' | 'role' | 'profile'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const { user, loading, isTestUser, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [checkingUserData, setCheckingUserData] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);
  
  // Track local user state for test mode users
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
    
    // For test users, also check localStorage directly
    if (isTestUser && !user) {
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const userData = JSON.parse(testModeUser);
          setLocalUser(userData);
        } catch (e) {
          console.error("Error parsing test user data:", e);
        }
      }
    }
  }, [user, isTestUser]);
  
  // User state handling
  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in SimpleAuth:", { user, localUser, loading, step, isTestUser });
    
    const activeUser = user || localUser;
    
    if (!loading && activeUser) {
      const checkUserSetup = async () => {
        setCheckingUserData(true);
        
        try {
          // Check if user has a complete profile
          const profileResult = await checkUserProfile(activeUser.id);
          console.log("Profile check result:", profileResult);
          
          // User with complete profile (has first name, last name, and role)
          if (profileResult.isComplete) {
            console.log("Complete profile detected, redirecting to dashboard");
            
            if (activeUser.role === 'seller') {
              navigate('/seller/dashboard', { replace: true });
            } else if (activeUser.role === 'captain') {
              navigate('/captain/dashboard', { replace: true });
            } else {
              navigate(redirect, { replace: true });
            }
          } 
          // User exists but incomplete profile (missing first name, last name, or role)
          else if (profileResult.exists) {
            if (!activeUser.role) {
              console.log("User exists but needs role selection");
              setStep('role');
            } else {
              console.log("User with role needs profile completion");
              setSelectedRole(activeUser.role as UserRole);
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
  }, [user, localUser, loading, navigate, redirect]);
  
  // When phone verification is successful
  const handleLoginSuccess = async () => {
    console.log("Login success callback triggered");
    setCheckingUserData(true);
    
    // Refresh user data to get latest state
    try {
      await refreshUser();
      console.log("User data refreshed after login");
      
      // For test users, get the user data directly from localStorage
      if (isTestUser) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          try {
            const userData = JSON.parse(testModeUser);
            setLocalUser(userData);
            
            // Check if user already has role and profile
            if (userData.role && userData.first_name !== 'New' && userData.last_name !== 'User') {
              if (userData.role === 'seller') {
                navigate('/seller/dashboard', { replace: true });
              } else if (userData.role === 'captain') {
                navigate('/captain/dashboard', { replace: true });
              } else {
                navigate(redirect, { replace: true });
              }
              setCheckingUserData(false);
              return;
            }
            
            // If test user doesn't have role, show role selection
            setStep('role');
            setCheckingUserData(false);
            return;
          } catch (e) {
            console.error("Error parsing test user data:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
    
    setCheckingUserData(false);
  };
  
  // When role is selected
  const handleRoleSelected = async (role: UserRole) => {
    console.log("Role selected:", role);
    const activeUser = user || localUser;
    console.log("Active user when role selected:", activeUser);
    
    setSelectedRole(role);
    
    if (!activeUser) {
      console.error("No user when role selected, this shouldn't happen");
      toast({
        title: "Error",
        description: "User information not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update user role in profile
      const updatedProfile = await saveUserProfile(activeUser.id, { role });
      console.log("User role updated to:", role, "Profile result:", updatedProfile);
      
      // Update local user data for test users
      if (isTestUser) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          try {
            const userData = JSON.parse(testModeUser);
            userData.role = role;
            localStorage.setItem('test_mode_user', JSON.stringify(userData));
            setLocalUser({...userData});
            console.log("Updated test user in localStorage:", userData);
          } catch (e) {
            console.error("Error updating test user data:", e);
          }
        }
      }
      
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
