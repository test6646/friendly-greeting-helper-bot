
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Loader2, ArrowRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneLoginFormProps {
  onSuccess?: () => void;
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(() => localStorage.getItem('auth_test_mode') === 'true');
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
    
    setLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Test mode doesn't actually send an OTP
      if (testMode) {
        setStep('otp');
        setOtpCode('000000'); // Auto-fill for convenience
        toast({
          title: "Test Mode",
          description: "OTP code 000000 has been auto-filled",
        });
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
          data: {
            phone: formattedPhone
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setStep('otp');
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
          }, 100);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {step === 'phone' ? 'Sign In with Phone' : 'Verify Phone Number'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center relative">
                <Phone className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                {testMode ? 
                  "Test mode: Use code 000000" : 
                  `We've sent a verification code to ${formatPhoneNumber(phoneNumber)}`
                }
              </p>
            </div>
            
            <div className="flex justify-center my-6">
              <InputOTP 
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                className="scale-110"
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
            
            <div className="flex flex-col gap-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              
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
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneLoginForm;
