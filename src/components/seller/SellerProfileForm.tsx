import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Loader2 } from 'lucide-react';
import { saveUserProfile } from '@/services/profileService';

const SellerProfileForm = () => {
  const { user, isTestUser, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    phone_number: '',
    cuisine_type: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a seller profile",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log("Creating seller profile for user ID:", user.id);
      
      // Update user profile role to seller for all users (test and real)
      await saveUserProfile(user.id, { role: 'seller' });
      
      // Create seller profile
      const sellerProfileData = {
        user_id: user.id,
        business_name: formData.business_name,
        business_description: formData.description,
        phone_number: formData.phone_number,
        cuisine_types: [formData.cuisine_type || 'Indian'],
        service_areas: { address: formData.address },
        verification_status: 'pending',
        is_active: true,
        kitchen_open: true
      };
      
      // For test users, update localStorage
      if (isTestUser) {
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          const updatedUser = JSON.parse(testModeUser);
          updatedUser.role = 'seller';
          updatedUser.first_name = updatedUser.first_name || formData.business_name.split(' ')[0];
          updatedUser.last_name = updatedUser.last_name || 'Seller';
          updatedUser.business_name = formData.business_name;
          updatedUser.business_description = formData.description;
          updatedUser.cuisine_type = formData.cuisine_type;
          updatedUser.phone_number = formData.phone_number;
          updatedUser.address = formData.address;
          updatedUser.kitchen_open = true;
          
          localStorage.setItem('test_mode_user', JSON.stringify(updatedUser));
        }
      }
      
      // Insert into seller_profiles for all users (test and real)
      const { data, error } = await supabase
        .from('seller_profiles')
        .insert(sellerProfileData)
        .select('*');

      if (error) {
        throw error;
      }
      
      console.log("Created seller profile:", data);

      toast({
        title: "Seller Profile Created",
        description: "You can now add meals to your menu"
      });
      
      // Force refresh auth context
      await refreshUser();
      
      // Redirect to seller dashboard
      navigate('/seller/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error("Error creating seller profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create seller profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Create Your Seller Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              placeholder="Your Food Business Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cuisine_type">Cuisine Type *</Label>
            <Input
              id="cuisine_type"
              name="cuisine_type"
              value={formData.cuisine_type}
              onChange={handleChange}
              required
              placeholder="e.g. North Indian, South Indian, Chinese, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              required
              placeholder="Your contact number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Your business address"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Tell customers about your food business, specialties, and experience"
              rows={4}
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Create Seller Profile"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SellerProfileForm;
