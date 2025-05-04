
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Loader2, ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion } from 'framer-motion';

interface PhoneLoginFormProps {
  onSuccess?: () => void;
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(() => localStorage.getItem('auth_test_mode') === 'true');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

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

  // Validate phone number format
  useEffect(() => {
    const formatted = formatPhoneNumber(phoneNumber);
    setFormattedPhone(formatted);
    
    // Basic validation: must have country code and at least 10 digits
    const isValid = /^\+\d{11,15}$/.test(formatted) || testMode;
    setIsValidPhone(isValid);
  }, [phoneNumber, testMode]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Toggle test mode
  const handleToggleTestMode = (enabled: boolean) => {
    setTestMode(enabled);
    localStorage.setItem('auth_test_mode', enabled ? 'true' : 'false');
    if (enabled) {
      toast({
        title: "Test Mode Activated",
        description: "Use code 000000 to verify in test mode",
      });
    }
  };

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPhone && !testMode) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Format phone number
      const formatted = formatPhoneNumber(phoneNumber);
      setFormattedPhone(formatted);
      
      // Test mode doesn't actually send an OTP
      if (testMode) {
        setStep('otp');
        setOtpCode('000000'); // Auto-fill for convenience
        toast({
          title: "Test Mode",
          description: "OTP code 000000 has been auto-filled",
        });
        
        // Start resend timer
        setResendTimer(60);
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
        options: {
          shouldCreateUser: true,
          data: {
            phone: formatted
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setStep('otp');
      setResendTimer(60); // Start 60s countdown for resend
      
      toast({
        title: "OTP Sent",
        description: "Verification code sent to your phone",
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0 || !formattedPhone) return;
    
    setLoading(true);
    
    try {
      if (testMode) {
        // In test mode, just reset the timer and show message
        setResendTimer(60);
        toast({
          title: "Test Mode",
          description: "OTP code remains 000000 in test mode",
        });
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        }
      });
      
      if (error) {
        throw error;
      }
      
      setResendTimer(60); // Start 60s countdown for resend
      
      toast({
        title: "OTP Resent",
        description: "New verification code sent to your phone",
      });
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // For test mode
      if (testMode) {
        if (otpCode === '000000') {
          // Create a test user
          const testUserData = {
            id: `test-${Date.now()}`,
            phone: formatPhoneNumber(phoneNumber),
            created_at: new Date().toISOString()
          };
          
          localStorage.setItem('test_mode_user', JSON.stringify(testUserData));
          
          toast({
            title: "Test Login Successful",
            description: "You are now logged in (test mode)",
          });
          
          // Make sure we wait a brief moment to ensure state is updated
          setTimeout(() => {
            if (onSuccess) {
              console.log("Calling onSuccess callback for test mode verification");
              onSuccess();
            }
          }, 300);
        } else {
          throw new Error("Invalid test code. Please use 000000 in test mode.");
        }
      } else {
        // Regular OTP verification
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formatPhoneNumber(phoneNumber),
          token: otpCode,
          type: 'sms'
        });
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Verification Successful",
          description: "Your phone number has been verified",
        });
        
        // Call onSuccess callback
        if (onSuccess) {
          console.log("Calling onSuccess callback for regular verification");
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-2">
        <Switch 
          id="test-mode" 
          checked={testMode}
          onCheckedChange={handleToggleTestMode}
        />
        <Label htmlFor="test-mode" className="text-sm text-muted-foreground cursor-pointer">
          Test Mode
        </Label>
      </div>
      
      {step === 'phone' ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">Phone Number</Label>
              <div className="flex items-center relative">
                <Phone className="absolute left-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 py-6 text-lg"
                  required
                />
              </div>
              
              {!isValidPhone && phoneNumber && !testMode && (
                <div className="flex items-center mt-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Please enter a valid phone number with country code
                </div>
              )}
              
              {isValidPhone && phoneNumber && (
                <div className="text-xs text-muted-foreground mt-1">
                  You'll receive a verification code at {formattedPhone}
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-lg"
              disabled={loading || (!isValidPhone && !testMode)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-base text-gray-600 dark:text-gray-300">
                {testMode ? 
                  "Test mode: Use code 000000" : 
                  `We've sent a verification code to ${formattedPhone}`
                }
              </p>
              {!testMode && (
                <p className="text-sm text-muted-foreground">
                  Please enter the 6-digit code to continue
                </p>
              )}
            </div>
            
            <div className="flex justify-center my-6">
              <InputOTP 
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                className="scale-110"
                pattern="\d{6}"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-16 w-12 text-xl" />
                  <InputOTPSlot index={1} className="h-16 w-12 text-xl" />
                  <InputOTPSlot index={2} className="h-16 w-12 text-xl" />
                  <InputOTPSlot index={3} className="h-16 w-12 text-xl" />
                  <InputOTPSlot index={4} className="h-16 w-12 text-xl" />
                  <InputOTPSlot index={5} className="h-16 w-12 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full py-6 text-lg"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              
              <div className="flex items-center justify-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || resendTimer > 0}
                  className="text-sm flex items-center text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setStep('phone')}
                disabled={loading}
              >
                Change Phone Number
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default PhoneLoginForm;
