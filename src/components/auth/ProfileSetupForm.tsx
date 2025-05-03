
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from './RoleSelectionForm';

interface ProfileSetupFormProps {
  role: UserRole;
  onSuccess: () => void;
  isTestUser: boolean;
}

const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({ role, onSuccess, isTestUser }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Seller fields
    businessName: '',
    businessDescription: '',
    cuisineType: 'Indian',
    // Captain fields
    vehicleType: 'Motorcycle',
    vehicleRegistration: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { toast } = useToast();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide your full name",
        variant: "destructive",
      });
      return;
    }
    
    if (role === 'seller' && !formData.businessName) {
      toast({
        title: "Missing Information",
        description: "Please provide your business name",
        variant: "destructive",
      });
      return;
    }
    
    if (role === 'captain' && !formData.vehicleRegistration) {
      toast({
        title: "Missing Information",
        description: "Please provide your vehicle registration",
        variant: "destructive",
      });
      return;
    }
    
    if (!agreeTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the terms to continue",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // For test users, update localStorage
      if (isTestUser) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          const userData = JSON.parse(testModeUser);
          
          const updatedUser = {
            ...userData,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email || null,
            role: role,
            ...(role === 'seller' && {
              business_name: formData.businessName,
              business_description: formData.businessDescription,
              cuisine_type: formData.cuisineType
            }),
            ...(role === 'captain' && {
              vehicle_type: formData.vehicleType,
              vehicle_registration: formData.vehicleRegistration
            })
          };
          
          localStorage.setItem('test_mode_user', JSON.stringify(updatedUser));
          
          toast({
            title: "Profile Created",
            description: `Your ${role} profile has been created successfully`,
          });
          
          onSuccess();
          return;
        }
      }
      
      // For real users
      // 1. Update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: role,
          ...(formData.email && { email: formData.email })
        }
      });
      
      if (metadataError) {
        throw metadataError;
      }
      
      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // 3. Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: role,
          ...(formData.email && { email: formData.email })
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error("Failed to update profile in database:", profileError);
        // Continue anyway as this isn't fatal
      }
      
      // 4. Create role-specific profile
      if (role === 'seller') {
        const { error: sellerError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: user.id,
            business_name: formData.businessName,
            business_description: formData.businessDescription || "Delicious homemade food",
            cuisine_types: [formData.cuisineType],
            is_active: true,
            kitchen_open: true
          });
          
        if (sellerError) {
          console.error("Failed to create seller profile:", sellerError);
        }
      }
      
      if (role === 'captain') {
        const { error: captainError } = await supabase
          .from('captain_profiles')
          .insert({
            user_id: user.id,
            vehicle_type: formData.vehicleType,
            vehicle_registration: formData.vehicleRegistration,
            is_active: true
          });
          
        if (captainError) {
          console.error("Failed to create captain profile:", captainError);
        }
      }
      
      toast({
        title: "Profile Created",
        description: `Your ${role} profile has been created successfully`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cuisineOptions = [
    { value: 'Indian', label: 'Indian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Mexican', label: 'Mexican' },
    { value: 'Thai', label: 'Thai' }
  ];
  
  const vehicleOptions = [
    { value: 'Bicycle', label: 'Bicycle' },
    { value: 'Motorcycle', label: 'Motorcycle' },
    { value: 'Car', label: 'Car' },
    { value: 'Other', label: 'Other' }
  ];
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {role === 'customer' ? 'Create Your Profile' : 
           role === 'seller' ? 'Create Seller Profile' : 
           'Create Captain Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          {/* Seller-specific fields */}
          {role === 'seller' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessName">Kitchen/Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Description</Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="Describe your food business"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Type *</Label>
                <select
                  id="cuisineType"
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent"
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
          
          {/* Captain-specific fields */}
          {role === 'captain' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent"
                  required
                >
                  {vehicleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
                <Input
                  id="vehicleRegistration"
                  name="vehicleRegistration"
                  value={formData.vehicleRegistration}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
          
          {/* Terms Agreement */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="terms" 
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked === true)} 
              className="mt-1"
            />
            <div>
              <Label 
                htmlFor="terms" 
                className="text-sm text-muted-foreground"
              >
                I agree to the Terms of Service and Privacy Policy
              </Label>
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
                Creating Profile...
              </>
            ) : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetupForm;
