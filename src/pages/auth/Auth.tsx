
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Phone, CheckCircle, AlertCircle, Truck, Info, Store, UserCircle, ArrowRight, Bug, Loader2 } from 'lucide-react';
import { ResponsiveInput } from '@/components/ui/responsive-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { SpiceButton } from '@/components/ui/spice-button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthOTP } from '@/hooks/use-auth-otp';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

// Role type for TypeScript
type UserRole = 'customer' | 'seller' | 'captain';

const Auth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'otp' | 'role' | 'details'>('phone');
  const [checkingProfile, setCheckingProfile] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Selected role for sign-up (defaults to customer)
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'seller' || roleParam === 'captain' || roleParam === 'customer') {
      return roleParam;
    }
    return 'customer';
  });

  const {
    sendOTP,
    verifyOTP,
    loading: otpLoading,
    error: otpError,
    testMode,
    toggleTestMode,
    formatPhoneNumber
  } = useAuthOTP();

  // Redirect authenticated users with complete profiles based on their role
  useEffect(() => {
    // Only redirect if we have a user with a complete profile
    if (user && !authLoading) {
      const redirectTo = searchParams.get('redirect') || '/';
      console.log("Auth: User is already authenticated with role:", user.role);
      
      // Redirect based on role
      if (user.role === 'seller') {
        navigate('/seller/dashboard', { replace: true });
      } else if (user.role === 'captain') {
        navigate('/captain/dashboard', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, authLoading, navigate, searchParams]);
  
  // Fill in test OTP code
  const fillTestOTP = () => {
    if (testMode) {
      setOtpCode('000000');
    }
  };

  // Vehicle type for captain role
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  
  // Profile details for customer, seller, and captain
  const [profileDetails, setProfileDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    cuisineType: 'Indian',
    vehicleRegistration: '',
  });

  // Handle profile details change
  const handleProfileChange = (field: string, value: string) => {
    setProfileDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow numbers, +, and spaces
    const sanitized = input.replace(/[^\d\s+]/g, '');
    setPhoneNumber(sanitized);
  };

  // Handle form submission with enter key
  const handlePhoneFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendOTP();
  };

  const handleOtpFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyOTP();
  };

  // Handle sending OTP
  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const { success, error } = await sendOTP(formattedPhone);
      
      if (success) {
        setAuthStep('otp');
        if (testMode) {
          toast({
            title: "Test Mode Active",
            description: "Use code 000000 to verify. No real SMS was sent.",
            variant: "info",
          });
          // Auto-fill test code in test mode for better UX
          setOtpCode('000000');
        } else {
          toast({
            title: "OTP Sent",
            description: "Please check your phone for the verification code",
          });
        }
      } else {
        toast({
          title: "Failed to Send OTP",
          description: error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const { success, error, session, isNewUser } = await verifyOTP(formattedPhone, otpCode);
      
      if (success && session) {
        // Always proceed to role selection for new verification
        setAuthStep('role');
        
        toast({
          title: "Verification Successful",
          description: "Your phone number has been verified",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: error || "Please try again with a valid OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle role selection
  const handleRoleSelection = () => {
    setAuthStep('details');
  };

  // Handle profile submission
  const handleProfileSubmission = async () => {
    if (!agreeTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate required fields based on role
      if (!profileDetails.firstName || !profileDetails.lastName) {
        toast({
          title: "Missing Information",
          description: "Please provide your full name",
          variant: "destructive",
        });
        return;
      }

      if (selectedRole === 'seller' && !profileDetails.businessName) {
        toast({
          title: "Missing Information",
          description: "Please provide a business name for your kitchen",
          variant: "destructive",
        });
        return;
      }

      if (selectedRole === 'captain' && !profileDetails.vehicleRegistration) {
        toast({
          title: "Missing Information",
          description: "Please provide vehicle registration details",
          variant: "destructive",
        });
        return;
      }

      // For test mode users, update the local storage data
      if (testMode) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          const updatedUser = JSON.parse(testModeUser);
          updatedUser.first_name = profileDetails.firstName;
          updatedUser.last_name = profileDetails.lastName;
          updatedUser.role = selectedRole;
          updatedUser.email = profileDetails.email || null;
          
          if (selectedRole === 'seller') {
            updatedUser.business_name = profileDetails.businessName;
            updatedUser.cuisine_type = profileDetails.cuisineType;
          }
          
          if (selectedRole === 'captain') {
            updatedUser.vehicle_type = vehicleType;
            updatedUser.vehicle_registration = profileDetails.vehicleRegistration;
          }
          
          localStorage.setItem('test_mode_user', JSON.stringify(updatedUser));
          
          toast({
            title: "Profile Created!",
            description: selectedRole === 'captain' 
              ? "Welcome to SheKaTiffin. Your captain account is pending verification." 
              : (selectedRole === 'seller'
                  ? "Welcome to SheKaTiffin. Set up your kitchen profile to start selling."
                  : "Welcome to SheKaTiffin. Your account has been created successfully."),
          });
          
          // Redirect based on role
          if (selectedRole === 'seller') {
            navigate('/seller/create-profile', { replace: true });
          } else if (selectedRole === 'captain') {
            navigate('/captain/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
          
          return;
        }
      }

      // Regular flow for real users
      // Update user metadata in Supabase
      const { data: userData, error: userError } = await supabase.auth.updateUser({
        data: {
          first_name: profileDetails.firstName,
          last_name: profileDetails.lastName,
          role: selectedRole,
          email: profileDetails.email || null,
          ...(selectedRole === 'seller' ? {
            business_name: profileDetails.businessName,
            cuisine_type: profileDetails.cuisineType
          } : {}),
          ...(selectedRole === 'captain' ? {
            vehicle_type: vehicleType,
            vehicle_registration: profileDetails.vehicleRegistration
          } : {})
        }
      });

      if (userError) {
        throw userError;
      }

      // Make sure the profile is updated in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          first_name: profileDetails.firstName,
          last_name: profileDetails.lastName,
          role: selectedRole,
          email: profileDetails.email || null
        })
        .eq('id', userData.user.id);

      if (profileError) {
        console.error("Failed to update profile in database:", profileError);
        // Continue anyway since the auth metadata is updated
      }

      toast({
        title: "Profile Created!",
        description: selectedRole === 'captain' 
          ? "Welcome to SheKaTiffin. Your captain account is pending verification." 
          : (selectedRole === 'seller'
              ? "Welcome to SheKaTiffin. Set up your kitchen profile to start selling."
              : "Welcome to SheKaTiffin. Your account has been created successfully."),
      });
      
      // Redirect based on role
      if (selectedRole === 'seller') {
        navigate('/seller/create-profile', { replace: true });
      } else if (selectedRole === 'captain') {
        navigate('/captain/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Profile Creation Failed",
        description: error.message || "Failed to create your profile",
        variant: "destructive",
      });
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Role-specific content
  const getRoleContent = () => {
    switch(selectedRole) {
      case 'customer':
        return {
          icon: <UserCircle className="h-6 w-6 text-primary" />,
          title: "Join as a Customer",
          description: "Discover authentic home-cooked meals from talented home chefs in your area."
        };
      case 'seller':
        return {
          icon: <Store className="h-6 w-6 text-secondary" />,
          title: "Join as a Chef/Seller",
          description: "Turn your cooking passion into a business from the comfort of your home."
        };
      case 'captain':
        return {
          icon: <Truck className="h-6 w-6 text-destructive" />,
          title: "Join as a Delivery Captain",
          description: "Earn money by delivering delicious homemade food in your area."
        };
      default:
        return {
          icon: <Info className="h-6 w-6" />,
          title: "Join SheKaTiffin",
          description: "Select a role above to continue."
        };
    }
  };

  // Vehicle type options
  const vehicleOptions = [
    { value: 'Bicycle', label: 'Bicycle' },
    { value: 'Motorcycle', label: 'Motorcycle' },
    { value: 'Car', label: 'Car' },
    { value: 'Other', label: 'Other' }
  ];

  // Cuisine type options for sellers
  const cuisineOptions = [
    { value: 'Indian', label: 'Indian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Mexican', label: 'Mexican' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Mediterranean', label: 'Mediterranean' },
    { value: 'American', label: 'American' },
    { value: 'Other', label: 'Other' }
  ];

  // Get role-specific content
  const roleContent = getRoleContent();

  // Show loading state when checking for existing profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Checking your account...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we retrieve your profile information.</p>
        </div>
      </div>
    );
  }

  // If user exists but is loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Full screen gradient background */}
      <div className="flex-1 flex items-center justify-center w-full py-8 px-4">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <motion.div 
            className="text-center mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SheKaTiffin
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
              Empowering women through home-cooked food. Join our community of talented women chefs or discover authentic homemade meals.
            </p>
          </motion.div>

          {/* Auth Component - Centered with more width */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="w-full"
          >
            <Card className="border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="pt-8 px-6 md:px-8 pb-8">
                {authStep === 'phone' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">Welcome</h2>
                      <p className="text-lg text-foreground/70">Enter your phone number to continue</p>
                    </div>
                    
                    <form onSubmit={handlePhoneFormSubmit} className="space-y-5">
                      {/* Test Mode Toggle */}
                      <div className="flex items-center justify-end space-x-2">
                        <Switch 
                          id="test-mode" 
                          checked={testMode}
                          onCheckedChange={toggleTestMode}
                        />
                        <Label htmlFor="test-mode" className="flex items-center cursor-pointer">
                          <Bug className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Test Mode</span>
                        </Label>
                      </div>
                      
                      {testMode && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                          <div className="flex items-start">
                            <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Test Mode Active</p>
                              <p className="mt-1">In test mode, the OTP code "000000" will work for any phone number without sending actual SMS.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <ResponsiveInput
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        icon={<Phone className="h-5 w-5" />}
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        label="Phone Number"
                        required
                        fullWidth
                        className="text-lg"
                      />
                      
                      <Button 
                        type="submit"
                        disabled={otpLoading || !phoneNumber}
                        className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-medium"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : "Send Verification Code"}
                      </Button>
                      
                      <p className="text-sm text-center text-foreground/60 mt-4">
                        By continuing, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                      </p>
                    </form>
                  </div>
                )}
                
                {authStep === 'otp' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">Verify Your Number</h2>
                      <p className="text-lg text-foreground/70">
                        {testMode ? 
                          "Test mode: Enter code 000000 (automatically filled for you)" : 
                          `We've sent a 6-digit code to ${formatPhoneNumber(phoneNumber)}`
                        }
                      </p>
                    </div>
                    
                    <form onSubmit={handleOtpFormSubmit} className="space-y-5">
                      {testMode && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                          <div className="flex items-center">
                            <Info className="h-5 w-5 mr-2 text-amber-600" />
                            <div className="text-amber-800">
                              <p>Test mode is active. The code 000000 has been automatically filled for you.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-center mb-6">
                        <InputOTP 
                          maxLength={6}
                          value={otpCode}
                          onChange={setOtpCode}
                          className="scale-125"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      
                      <Button 
                        type="submit"
                        disabled={isVerifying || otpCode.length < 6}
                        className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-medium"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : "Verify Code"}
                      </Button>
                      
                      <div className="flex justify-between items-center mt-4">
                        <button 
                          type="button"
                          onClick={() => setAuthStep('phone')}
                          className="text-primary hover:underline"
                        >
                          Change phone number
                        </button>
                        
                        <button 
                          type="button"
                          onClick={handleSendOTP}
                          disabled={otpLoading}
                          className="text-primary hover:underline"
                        >
                          {otpLoading ? "Sending..." : "Resend code"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {authStep === 'role' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">Choose Your Role</h2>
                      <p className="text-lg text-foreground/70">Select how you want to use SheKaTiffin</p>
                    </div>
                    
                    <RadioGroup 
                      value={selectedRole}
                      onValueChange={(value) => setSelectedRole(value as UserRole)}
                      className="grid gap-4"
                    >
                      <Label 
                        htmlFor="customer-role"
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                          selectedRole === 'customer' ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="customer" id="customer-role" className="text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-lg">Customer</div>
                          <div className="text-muted-foreground">Order homemade food from local chefs</div>
                        </div>
                        <UserCircle className={`h-8 w-8 ${selectedRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Label>
                      
                      <Label 
                        htmlFor="seller-role"
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                          selectedRole === 'seller' ? 'border-secondary bg-secondary/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="seller" id="seller-role" className="text-secondary" />
                        <div className="flex-1">
                          <div className="font-medium text-lg">Seller/Chef</div>
                          <div className="text-muted-foreground">Sell your homemade food on our platform</div>
                        </div>
                        <Store className={`h-8 w-8 ${selectedRole === 'seller' ? 'text-secondary' : 'text-muted-foreground'}`} />
                      </Label>
                      
                      <Label 
                        htmlFor="captain-role"
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                          selectedRole === 'captain' ? 'border-destructive bg-destructive/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="captain" id="captain-role" className="text-destructive" />
                        <div className="flex-1">
                          <div className="font-medium text-lg">Delivery Captain</div>
                          <div className="text-muted-foreground">Deliver food and earn money</div>
                        </div>
                        <Truck className={`h-8 w-8 ${selectedRole === 'captain' ? 'text-destructive' : 'text-muted-foreground'}`} />
                      </Label>
                    </RadioGroup>
                    
                    <Button 
                      onClick={handleRoleSelection}
                      className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-medium"
                    >
                      Continue <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
                
                {authStep === 'details' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">{roleContent.title}</h2>
                      <p className="text-lg text-foreground/70">{roleContent.description}</p>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ResponsiveInput
                          id="first-name"
                          placeholder="First Name"
                          value={profileDetails.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          label="First Name*"
                          required
                          fullWidth
                          className="text-lg"
                        />
                        
                        <ResponsiveInput
                          id="last-name"
                          placeholder="Last Name"
                          value={profileDetails.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          label="Last Name*"
                          required
                          fullWidth
                          className="text-lg"
                        />
                      </div>
                      
                      <ResponsiveInput
                        id="email"
                        type="email"
                        placeholder="yourname@example.com"
                        value={profileDetails.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        label="Email (optional)"
                        fullWidth
                        className="text-lg"
                      />
                      
                      {selectedRole === 'seller' && (
                        <>
                          <ResponsiveInput
                            id="business-name"
                            placeholder="Your kitchen or business name"
                            icon={<Store className="h-5 w-5" />}
                            value={profileDetails.businessName}
                            onChange={(e) => handleProfileChange('businessName', e.target.value)}
                            label="Kitchen Name*"
                            required
                            fullWidth
                            className="text-lg"
                          />

                          <div className="space-y-2">
                            <Label htmlFor="cuisine-type" className="text-base font-medium">
                              Primary Cuisine Type*
                            </Label>
                            <select
                              id="cuisine-type"
                              value={profileDetails.cuisineType}
                              onChange={(e) => handleProfileChange('cuisineType', e.target.value)}
                              className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground text-lg"
                              required
                            >
                              {cuisineOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {selectedRole === 'captain' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="vehicle-type" className="text-base font-medium">
                              Vehicle Type*
                            </Label>
                            <select
                              id="vehicle-type"
                              value={vehicleType}
                              onChange={(e) => setVehicleType(e.target.value)}
                              className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground text-lg"
                              required
                            >
                              {vehicleOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <ResponsiveInput
                            id="vehicle-registration"
                            placeholder="Vehicle registration number"
                            icon={<Info className="h-5 w-5" />}
                            value={profileDetails.vehicleRegistration}
                            onChange={(e) => handleProfileChange('vehicleRegistration', e.target.value)}
                            label="Vehicle Registration Number*"
                            required
                            fullWidth
                            className="text-lg"
                          />
                        </>
                      )}

                      <div className="flex items-start space-x-3 pt-2">
                        <Checkbox 
                          id="terms" 
                          checked={agreeTerms}
                          onCheckedChange={(checked) => setAgreeTerms(checked === true)} 
                          className="mt-1.5 h-5 w-5 rounded"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label 
                            htmlFor="terms" 
                            className="text-muted-foreground"
                          >
                            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAuthStep('role')}
                          className="flex-1 h-11 text-base"
                        >
                          Back
                        </Button>
                        
                        <Button 
                          type="button"
                          onClick={handleProfileSubmission}
                          className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 text-base"
                        >
                          Complete Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
