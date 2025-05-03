
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { saveUserProfile } from '@/services/profileService';

interface OTPResult {
  success: boolean;
  error?: string;
  session?: any;
  isNewUser?: boolean;
}

export const useAuthOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [testMode, setTestMode] = useState(() => {
    // Check if test mode was previously enabled in local storage
    return localStorage.getItem('auth_test_mode') === 'true';
  });

  // Toggle test mode
  const toggleTestMode = (enabled: boolean) => {
    setTestMode(enabled);
    localStorage.setItem('auth_test_mode', enabled ? 'true' : 'false');
  };

  // Format phone number to E.164 format
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check if it already has a country code
    if (phone.startsWith('+')) {
      return '+' + digits;
    }
    
    // Default to Indian country code if not provided
    return '+91' + digits;
  };

  // Send OTP to the provided phone number
  const sendOTP = async (phoneNumber: string): Promise<OTPResult> => {
    try {
      setLoading(true);
      setError(null);

      // Ensure proper E.164 format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Log for debugging
      console.log(`Attempting to send OTP to: ${formattedPhone}`);

      // If test mode is enabled, don't actually send OTP
      if (testMode) {
        console.log('Test mode active: Skipping actual OTP sending');
        toast({
          title: "Test mode active",
          description: "Use code 000000 to verify in test mode",
          variant: "info"
        });
        return {
          success: true
        };
      }

      // Validate phone number format
      if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
        const errorMsg = "Invalid phone number format. Must include country code (e.g., +91)";
        setError(errorMsg);
        toast({
          title: "Invalid Phone Number",
          description: errorMsg,
          variant: "destructive"
        });
        return {
          success: false,
          error: errorMsg
        };
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          // Custom OTP message as requested
          data: {
            otp_template: "SheKaTiffin: Use code {otp} to verify your account. Valid for {time} minutes only. Complete verification now and get 25% off your first tiffin order! Our chef is ready to prepare your meal."
          }
        }
      });

      if (error) {
        console.error("Supabase OTP Error:", error);
        setError(error.message);
        toast({
          title: "OTP Error",
          description: error.message,
          variant: "destructive"
        });
        return {
          success: false,
          error: error.message
        };
      }

      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
        variant: "default"
      });

      return {
        success: true
      };
    } catch (err: any) {
      console.error("Unexpected error sending OTP:", err);
      const errorMessage = err.message || "Failed to send OTP";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const verifyOTP = async (phoneNumber: string, otpCode: string): Promise<OTPResult> => {
    try {
      setLoading(true);
      setError(null);

      // Format the phone number
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log(`Attempting to verify OTP for: ${formattedPhone}`);

      // In test mode, accept "000000" as valid OTP without any API calls
      if (testMode && otpCode === "000000") {
        console.log('Test mode: Using default OTP code');
        
        // Check if a user with this phone number already exists in the database
        const { data: existingProfile, error: lookupError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, created_at')
          .eq('phone', formattedPhone)
          .maybeSingle();
          
        console.log("Lookup result for test user:", { existingProfile, lookupError });
        
        // Create a unique ID for the test user
        const testUserId = `test-${Date.now()}`;
        
        // Create test user data
        let testUserData: any = {
          id: testUserId,
          phone: formattedPhone,
          role: null,  // Always set role to null for new test users
          email: null,
          created_at: new Date().toISOString(),
          first_name: null,
          last_name: null,
          isNewUser: true
        };
        
        let isNewUser = true;
        
        // If there's an existing user with this phone number, use their data
        if (existingProfile && !lookupError) {
          console.log("Found existing user with this phone number");
          isNewUser = false;
          
          // Use existing user's data
          testUserData = {
            ...testUserData,
            first_name: existingProfile.first_name,
            last_name: existingProfile.last_name,
            role: existingProfile.role,
            isNewUser: false
          };
        } else {
          // Create a new profile in the database for this test user
          try {
            const saveResult = await saveUserProfile(testUserId, {
              phone: formattedPhone,
              first_name: 'New',
              last_name: 'User',
              role: null  // Ensure role is null to trigger role selection
            });
            
            console.log("Created new profile for test user:", saveResult);
          } catch (saveError) {
            console.error("Failed to create profile for test user:", saveError);
          }
        }
        
        // Store test user in local storage for persistence
        localStorage.setItem('test_mode_user', JSON.stringify(testUserData));
        
        // Create a simplified mock session object
        const mockSession = {
          access_token: `test-token-${Date.now()}`,
          refresh_token: `test-refresh-${Date.now()}`,
          user: testUserData,
          expires_at: Date.now() + 3600000 // 1 hour expiry
        };
        
        toast({
          title: "Test Login Successful",
          description: "Phone verified successfully",
        });

        return {
          success: true,
          session: mockSession,
          isNewUser
        };
      }

      // Test mode, but invalid test OTP
      if (testMode && otpCode !== "000000") {
        const errorMsg = "Invalid test OTP code. Use 000000 in test mode.";
        setError(errorMsg);
        toast({
          title: "Invalid OTP",
          description: errorMsg,
          variant: "destructive"
        });
        return {
          success: false,
          error: errorMsg
        };
      }

      // Regular OTP verification for non-test mode
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms'
      });

      if (error) {
        console.error("OTP Verification Error:", error);
        setError(error.message);
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive"
        });
        return {
          success: false,
          error: error.message
        };
      }

      // Check if this is a new user (needs profile setup)
      // We'll check if the user has an existing profile with name set
      let isNewUser = true;
      
      if (!testMode && data.session && data.session.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("first_name, last_name, role")
            .eq("id", data.session.user.id)
            .single();
            
          if (!profileError && profileData && 
              profileData.first_name && 
              profileData.first_name !== 'New' && 
              profileData.last_name && 
              profileData.last_name !== 'User' &&
              profileData.role) {
            // User has a properly set up profile
            isNewUser = false;
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
          // Assume new user if we can't verify
          isNewUser = true;
        }
      }

      toast({
        title: "Verification Successful",
        description: "Your phone number has been verified",
      });

      return {
        success: true,
        session: data.session,
        isNewUser
      };
    } catch (err: any) {
      console.error("Unexpected error verifying OTP:", err);
      const errorMessage = err.message || "Failed to verify OTP";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out current user
  const signOut = async (): Promise<OTPResult> => {
    try {
      setLoading(true);
      
      // If in test mode, just clear the test user from local storage
      if (testMode) {
        localStorage.removeItem('test_mode_user');
        toast({
          title: "Logged Out",
          description: "You have been logged out from test mode",
        });
        return {
          success: true
        };
      }
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive"
        });
        return {
          success: false,
          error: error.message
        };
      }

      toast({
        title: "Signed Out",
        description: "You have been successfully logged out",
      });

      return {
        success: true
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign out";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    testMode,
    toggleTestMode,
    sendOTP,
    verifyOTP,
    signOut,
    formatPhoneNumber
  };
};
