import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Settings, Shield, MapPin, CreditCard, FileText, Camera, Upload, Trash2, Check, Loader2 } from 'lucide-react';
import SellerVerificationForm from '@/components/profile/SellerVerificationForm';
import AddressForm from '@/components/profile/AddressForm';
import OrderHistory from '@/components/profile/OrderHistory';
import PaymentMethods from '@/components/profile/PaymentMethods';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

const ProfilePage = () => {
  const { user, loading: authLoading } = useSimpleAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    profile_image_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // If user is not logged in, redirect to login page
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not authenticated, redirecting to auth");
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user && !isDataFetched) {
        try {
          setIsLoading(true);
          setFetchError(null);
          
          console.log("Fetching profile data for user:", user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile data:', error);
            setFetchError("Failed to load profile data. Please try again.");
            toast({
              title: "Error",
              description: "Failed to load profile data",
              variant: "destructive"
            });
            return;
          }

          if (data) {
            console.log("Profile data fetched successfully:", data);
            setProfileData({
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              email: user.email || '',
              phone: data.phone || '',
              gender: data.gender || '',
              profile_image_url: data.profile_image_url || ''
            });
            setIsDataFetched(true);
          }
        } catch (error: any) {
          console.error('Error in fetchProfileData:', error);
          setFetchError("Failed to load profile data. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!user && !authLoading) {
        // If not loading and no user, reset data fetched flag
        setIsDataFetched(false);
        setProfileData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          gender: '',
          profile_image_url: ''
        });
      }
    };

    fetchProfileData();
  }, [user, isDataFetched, authLoading, toast]);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to storage and update profile
  const uploadProfileImage = async () => {
    if (!fileToUpload || !user) return;

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const filePath = `profile-images/${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
        
      // Update profile with new image URL
      const imageUrl = publicUrlData.publicUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setProfileData(prev => ({ ...prev, profile_image_url: imageUrl }));
      setFileToUpload(null);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // If there's a new image to upload, do that first
      if (fileToUpload) {
        await uploadProfileImage();
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          gender: profileData.gender,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If auth is still loading, show a loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <div className="animate-pulse text-primary text-xl">Checking authentication...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // If user not authenticated, redirect component will handle it
  if (!user) {
    return null;
  }

  // If data is loading, show a loading state
  if (isLoading && !isDataFetched) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <div className="animate-pulse text-primary text-xl">Loading profile data...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // If there was an error fetching data
  if (fetchError && !isDataFetched) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl">{fetchError}</div>
            <Button onClick={() => setIsDataFetched(false)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 px-4 md:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">My Account</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            
            {/* Role Badge */}
            {user.role && (
              <Badge className={`px-3 py-1 text-sm capitalize ${
                user.role === 'seller' ? 'bg-primary text-white' : 
                user.role === 'admin' ? 'bg-purple-500 text-white' : 
                'bg-gray-200 text-gray-800'
              }`}>
                {user.role}
              </Badge>
            )}
          </div>
          
          {/* Main content using our new ProfileLayout component */}
          <ProfileLayout 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            userRole={user.role}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-100">
                        {(profileData.profile_image_url || previewImage) ? (
                          <img 
                            src={previewImage || profileData.profile_image_url}
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <label htmlFor="profile-image" className="cursor-pointer p-2 bg-white rounded-full">
                            <Camera className="h-5 w-5 text-primary" />
                            <input 
                              id="profile-image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    {isEditing && fileToUpload && (
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        New image selected
                      </div>
                    )}
                    
                    {!isEditing && (
                      <h3 className="mt-4 text-lg font-semibold">
                        {profileData.first_name} {profileData.last_name}
                      </h3>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input 
                        id="first-name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input 
                        id="last-name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">Contact support to change your email</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={profileData.gender || ''}
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                        disabled={!isEditing}
                        className="w-full border-gray-300 rounded-md focus:border-primary focus:ring-primary disabled:bg-gray-50"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-4">
                    {isEditing ? (
                      <>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isLoading}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={() => setIsEditing(true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </form>
              </>
            )}
            
            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Delivery Addresses</h2>
                <AddressForm userId={user.id} />
              </>
            )}
            
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Order History</h2>
                <OrderHistory userId={user.id} />
              </>
            )}
            
            {/* Payment Methods Tab */}
            {activeTab === 'payment' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>
                <PaymentMethods userId={user.id} />
              </>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  {/* Notifications Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive order updates and promotions</p>
                        </div>
                        <Switch defaultChecked id="email-notifications" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive real-time updates on your orders</p>
                        </div>
                        <Switch defaultChecked id="push-notifications" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Communications</p>
                          <p className="text-sm text-gray-500">Receive special offers and promotions</p>
                        </div>
                        <Switch id="marketing-notifications" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Privacy Settings */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Privacy</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Profile Visibility</p>
                          <p className="text-sm text-gray-500">Make your profile visible to others</p>
                        </div>
                        <Switch defaultChecked id="profile-visibility" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Change */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Security</h3>
                    <Button variant="outline" className="border-gray-300">
                      Change Password
                    </Button>
                  </div>
                  
                  {/* Delete Account */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      This action is permanent and cannot be undone. All your data will be deleted.
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {/* Seller Verification Tab */}
            {activeTab === 'verification' && user.role === 'seller' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Seller Verification</h2>
                <SellerVerificationForm userId={user.id} />
              </>
            )}
          </ProfileLayout>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
