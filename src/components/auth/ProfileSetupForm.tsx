
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { saveUserProfile } from '@/services/profileService';
import type { UserRole } from './RoleSelectionForm';
import { motion } from 'framer-motion';
import { ResponsiveInput } from '@/components/ui/responsive-input';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (role === 'seller' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (role === 'captain' && !formData.vehicleRegistration.trim()) {
      newErrors.vehicleRegistration = 'Vehicle registration is required';
    }
    
    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the current user
      let userId = '';
      
      // For test users, get ID from localStorage
      if (isTestUser) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          const userData = JSON.parse(testModeUser);
          userId = userData.id;
          
          // Update test user data in localStorage
          const updatedUser = {
            ...userData,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email || null,
            role: role
          };
          
          localStorage.setItem('test_mode_user', JSON.stringify(updatedUser));
        } else {
          throw new Error("Test user data not found");
        }
      } else {
        // For real users, get ID from Supabase session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not found");
        }
        userId = user.id;
      }
      
      if (!userId) {
        throw new Error("Could not determine user ID");
      }
      
      console.log("Creating/updating profile for user ID:", userId);
      
      // Common profile data
      const profileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: role,
        ...(formData.email && { email: formData.email })
      };
      
      // Save profile data to database
      const result = await saveUserProfile(userId, profileData);
      
      if (!result && !isTestUser) {
        throw new Error("Failed to save profile");
      }
      
      // Create role-specific profile
      if (role === 'seller') {
        const { error: sellerError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: userId,
            business_name: formData.businessName,
            business_description: formData.businessDescription || "Delicious homemade food",
            cuisine_types: [formData.cuisineType],
            is_active: true,
            kitchen_open: true
          });
          
        if (sellerError) {
          console.error("Failed to create seller profile:", sellerError);
          // Continue anyway
        }
      }
      
      if (role === 'captain') {
        const { error: captainError } = await supabase
          .from('captain_profiles')
          .insert({
            user_id: userId,
            vehicle_type: formData.vehicleType,
            vehicle_registration: formData.vehicleRegistration,
            is_active: true
          });
          
        if (captainError) {
          console.error("Failed to create captain profile:", captainError);
          // Continue anyway
        }
      }
      
      toast({
        title: "Profile Created",
        description: `Your ${role} profile has been created successfully`,
      });
      
      // Small delay before calling onSuccess
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
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
  
  // Form animation
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <motion.div variants={itemVariants} className="space-y-1">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Tell us a bit about yourself
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base">First Name *</Label>
            <ResponsiveInput
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "border-red-500" : ""}
              mobileStyles="h-14 text-base"
              required
              placeholder="Your first name"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base">Last Name *</Label>
            <ResponsiveInput
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "border-red-500" : ""}
              mobileStyles="h-14 text-base"
              required
              placeholder="Your last name"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName}</p>
            )}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="email" className="text-base">Email (Optional)</Label>
          <ResponsiveInput
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-red-500" : ""}
            mobileStyles="h-14 text-base"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </motion.div>
        
        {/* Seller-specific fields */}
        {role === 'seller' && (
          <motion.div variants={itemVariants}>
            <div className="space-y-1 pt-4 border-t border-gray-100 mt-6">
              <h3 className="text-lg font-semibold mt-4">Kitchen Details</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tell us about your food business
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-base">Kitchen/Business Name *</Label>
                <ResponsiveInput
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={errors.businessName ? "border-red-500" : ""}
                  mobileStyles="h-14 text-base"
                  placeholder="E.g., Amma's Kitchen"
                  required
                />
                {errors.businessName && (
                  <p className="text-xs text-red-500">{errors.businessName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="text-base">Description</Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="Describe your food business"
                  className="min-h-[100px] text-base"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cuisineType" className="text-base">Cuisine Type *</Label>
                <select
                  id="cuisineType"
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleChange}
                  className="w-full h-14 px-4 py-2 rounded-md border border-input bg-transparent text-base"
                  required
                >
                  {cuisineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Captain-specific fields */}
        {role === 'captain' && (
          <motion.div variants={itemVariants}>
            <div className="space-y-1 pt-4 border-t border-gray-100 mt-6">
              <h3 className="text-lg font-semibold mt-4">Vehicle Information</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tell us about your delivery vehicle
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-base">Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full h-14 px-4 py-2 rounded-md border border-input bg-transparent text-base"
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
                <Label htmlFor="vehicleRegistration" className="text-base">Vehicle Registration Number *</Label>
                <ResponsiveInput
                  id="vehicleRegistration"
                  name="vehicleRegistration"
                  value={formData.vehicleRegistration}
                  onChange={handleChange}
                  className={errors.vehicleRegistration ? "border-red-500" : ""}
                  mobileStyles="h-14 text-base"
                  placeholder="E.g., MH02AB1234"
                  required
                />
                {errors.vehicleRegistration && (
                  <p className="text-xs text-red-500">{errors.vehicleRegistration}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Terms Agreement */}
        <motion.div variants={itemVariants} className="flex items-start space-x-3 pt-4 border-t border-gray-100 mt-6">
          <Checkbox 
            id="terms" 
            checked={agreeTerms}
            onCheckedChange={(checked) => {
              setAgreeTerms(checked === true);
              if (checked) {
                setErrors(prev => ({ ...prev, terms: '' }));
              }
            }} 
            className="mt-1"
          />
          <div>
            <Label 
              htmlFor="terms" 
              className={`text-sm ${errors.terms ? "text-red-500" : "text-muted-foreground"}`}
            >
              I agree to the Terms of Service and Privacy Policy
            </Label>
            {errors.terms && (
              <p className="text-xs text-red-500 mt-1">{errors.terms}</p>
            )}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full py-6 text-lg mt-6" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Profile
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default ProfileSetupForm;
