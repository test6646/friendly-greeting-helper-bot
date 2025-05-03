import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Upload,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SellerProfile } from '@/services/mealService';
import { Json } from '@/integrations/supabase/types';

interface SellerSettingsProps {
  sellerId: string;
  sellerProfile: SellerProfile | null;
}

// Define availability type
interface Availability {
  monday: { open: boolean; start: string; end: string };
  tuesday: { open: boolean; start: string; end: string };
  wednesday: { open: boolean; start: string; end: string };
  thursday: { open: boolean; start: string; end: string };
  friday: { open: boolean; start: string; end: string };
  saturday: { open: boolean; start: string; end: string };
  sunday: { open: boolean; start: string; end: string };
}

// Define social media type
interface SocialMedia {
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

// Define service areas type
interface ServiceAreas {
  areas: string[];
  maxRadius?: number;
}

const SellerSettings: React.FC<SellerSettingsProps> = ({ sellerId, sellerProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // For form fields
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [newCuisineType, setNewCuisineType] = useState('');
  const [specialDiets, setSpecialDiets] = useState<string[]>([]);
  const [newSpecialDiet, setNewSpecialDiet] = useState('');
  
  // For availability
  const [availability, setAvailability] = useState<Availability>({
    monday: { open: true, start: '09:00', end: '17:00' },
    tuesday: { open: true, start: '09:00', end: '17:00' },
    wednesday: { open: true, start: '09:00', end: '17:00' },
    thursday: { open: true, start: '09:00', end: '17:00' },
    friday: { open: true, start: '09:00', end: '17:00' },
    saturday: { open: true, start: '09:00', end: '17:00' },
    sunday: { open: false, start: '09:00', end: '17:00' }
  });
  
  // For service areas
  const [serviceAreas, setServiceAreas] = useState<ServiceAreas>({
    areas: [],
    maxRadius: undefined
  });
  const [newServiceArea, setNewServiceArea] = useState('');
  
  // For social media
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({
    website: '',
    instagram: '',
    facebook: '',
    twitter: ''
  });
  
  // For gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUpload, setGalleryUpload] = useState<File | null>(null);
  
  // For settings
  const [isActive, setIsActive] = useState(true);
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [isPromoted, setIsPromoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setSellerProfile] = useState<SellerProfile | null>(null);
  
  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('user_id', sellerId)
          .single();
          
        if (error) throw error;
        
        // Add kitchen_open if it doesn't exist in the data
        const profileWithKitchenOpen = {
          ...data,
          kitchen_open: Boolean(data.kitchen_open),
          average_rating: data.rating || 0,
          verified: data.verification_status === 'approved',
          social_media: data.social_media || {},
          gallery_images: data.gallery_images || [],
          availability: data.availability || {},
          commission_rate: data.commission_rate || 10,
          special_diets: data.special_diets || [],
          is_promoted: data.is_promoted || false
        };
        
        setSellerProfile(profileWithKitchenOpen as unknown as SellerProfile);
        
        // Initialize social media state
        if (profileWithKitchenOpen.social_media) {
          const socialData = profileWithKitchenOpen.social_media as any;
          setSocialMedia({
            website: socialData.website || '',
            instagram: socialData.instagram || '',
            facebook: socialData.facebook || '',
            twitter: socialData.twitter || ''
          });
        }
        
        // Initialize service areas state
        if (profileWithKitchenOpen.service_areas) {
          const areasData = profileWithKitchenOpen.service_areas as any;
          setServiceAreas({
            areas: areasData.areas || [],
            maxRadius: areasData.maxRadius
          });
        }
        
        // Initialize availability state
        if (profileWithKitchenOpen.availability) {
          const availData = profileWithKitchenOpen.availability as any;
          setAvailability(availData as Availability);
        }
        
        // Set form values from profile
        setBusinessName(profileWithKitchenOpen.business_name || '');
        setBusinessDescription(profileWithKitchenOpen.business_description || '');
        setCoverImagePreview(profileWithKitchenOpen.cover_image_url || null);
        setCuisineTypes(profileWithKitchenOpen.cuisine_types || []);
        setSpecialDiets(profileWithKitchenOpen.special_diets || []);
        setGalleryImages(profileWithKitchenOpen.gallery_images || []);
        setIsActive(profileWithKitchenOpen.is_active !== undefined ? profileWithKitchenOpen.is_active : true);
        setKitchenOpen(Boolean(profileWithKitchenOpen.kitchen_open));
        setIsPromoted(profileWithKitchenOpen.is_promoted !== undefined ? profileWithKitchenOpen.is_promoted : false);
        
      } catch (error) {
        console.error('Error fetching seller profile:', error);
        toast({
          title: "Error",
          description: "Failed to load seller profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerProfile();
  }, [sellerId, toast]);
  
  // Handle cover image selection
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle gallery image selection
  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGalleryUpload(file);
    }
  };
  
  // Upload image to storage
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${folder}/${sellerId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('seller-content')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('seller-content')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading ${folder} image:`, error);
      throw error;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      setSaving(true);
      let coverImageUrl = profile.cover_image_url;
      let updatedGalleryImages = [...galleryImages];
      
      // Upload cover image if changed
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage, 'covers');
      }
      
      // Upload gallery image if provided
      if (galleryUpload) {
        const galleryImageUrl = await uploadImage(galleryUpload, 'gallery');
        updatedGalleryImages.push(galleryImageUrl);
        setGalleryUpload(null);
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          business_name: businessName,
          business_description: businessDescription,
          cover_image_url: coverImageUrl,
          gallery_images: updatedGalleryImages,
          cuisine_types: cuisineTypes,
          special_diets: specialDiets,
          service_areas: { areas: serviceAreas.areas, maxRadius: serviceAreas.maxRadius } as any,
          availability: availability as any,
          social_media: socialMedia as any,
          is_active: isActive,
          kitchen_open: kitchenOpen,
          is_promoted: isPromoted
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile settings updated successfully",
      });
      
      // Update gallery images state
      setGalleryImages(updatedGalleryImages);
    } catch (error: any) {
      console.error('Error updating profile settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cuisine type addition
  const handleAddCuisineType = () => {
    if (newCuisineType && !cuisineTypes.includes(newCuisineType)) {
      setCuisineTypes([...cuisineTypes, newCuisineType]);
      setNewCuisineType('');
    }
  };
  
  // Handle cuisine type removal
  const handleRemoveCuisineType = (type: string) => {
    setCuisineTypes(cuisineTypes.filter(t => t !== type));
  };
  
  // Handle special diet addition
  const handleAddSpecialDiet = () => {
    if (newSpecialDiet && !specialDiets.includes(newSpecialDiet)) {
      setSpecialDiets([...specialDiets, newSpecialDiet]);
      setNewSpecialDiet('');
    }
  };
  
  // Handle special diet removal
  const handleRemoveSpecialDiet = (diet: string) => {
    setSpecialDiets(specialDiets.filter(d => d !== diet));
  };
  
  // Handle service area addition
  const handleAddServiceArea = () => {
    if (newServiceArea && !serviceAreas.areas.includes(newServiceArea)) {
      setServiceAreas({
        areas: [...serviceAreas.areas, newServiceArea],
        maxRadius: serviceAreas.maxRadius
      });
      setNewServiceArea('');
    }
  };
  
  // Handle service area removal
  const handleRemoveServiceArea = (area: string) => {
    setServiceAreas({
      areas: serviceAreas.areas.filter(a => a !== area),
      maxRadius: serviceAreas.maxRadius
    });
  };
  
  // Handle gallery image removal
  const handleRemoveGalleryImage = (url: string) => {
    setGalleryImages(galleryImages.filter(img => img !== url));
  };
  
  // Handle day toggle in availability
  const handleDayToggle = (day: keyof Availability) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        open: !prev[day].open
      }
    }));
  };
  
  // Handle time change in availability
  const handleTimeChange = (day: keyof Availability, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Settings</h2>
        <p className="text-gray-500">Manage your business profile and settings</p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business Hours</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Areas</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Update your business information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cover Image */}
                <div className="space-y-2">
                  <Label htmlFor="cover-image">Cover Image</Label>
                  <div className="relative h-56 rounded-lg overflow-hidden border bg-gray-50">
                    {coverImagePreview ? (
                      <img 
                        src={coverImagePreview} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label 
                        htmlFor="cover-upload" 
                        className="cursor-pointer bg-white text-primary hover:bg-gray-50 font-medium py-2 px-4 rounded-md flex items-center"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Cover
                        <input 
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverImageChange}
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Recommended: 1280x400px. Max size: 5MB.
                  </p>
                </div>
                
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                
                {/* Business Description */}
                <div className="space-y-2">
                  <Label htmlFor="business-description">Business Description</Label>
                  <Textarea 
                    id="business-description" 
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Tell customers about your business, your specialties, and your story.
                  </p>
                </div>
                
                {/* Cuisine Types */}
                <div className="space-y-2">
                  <Label>Cuisine Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {cuisineTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="py-1.5 px-3 flex gap-1 items-center">
                        {type}
                        <button 
                          type="button"
                          className="ml-1 text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveCuisineType(type)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex mt-2 gap-2">
                    <Input 
                      placeholder="Add cuisine type..."
                      value={newCuisineType}
                      onChange={(e) => setNewCuisineType(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddCuisineType}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                {/* Special Diets */}
                <div className="space-y-2">
                  <Label>Special Diets</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialDiets.map((diet) => (
                      <Badge key={diet} variant="secondary" className="py-1.5 px-3 flex gap-1 items-center">
                        {diet}
                        <button 
                          type="button"
                          className="ml-1 text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveSpecialDiet(diet)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex mt-2 gap-2">
                    <Input 
                      placeholder="Add special diet..."
                      value={newSpecialDiet}
                      onChange={(e) => setNewSpecialDiet(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddSpecialDiet}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Examples: Vegetarian, Vegan, Gluten-Free, Dairy-Free, etc.
                  </p>
                </div>
                
                {/* Status Settings */}
                <div className="space-y-4 border-t pt-4">
                  <Label>Status Settings</Label>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Active</p>
                      <p className="text-sm text-gray-500">
                        Make your business visible to customers
                      </p>
                    </div>
                    <Switch 
                      checked={isActive} 
                      onCheckedChange={setIsActive}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Kitchen Open</p>
                      <p className="text-sm text-gray-500">
                        Allow customers to place orders
                      </p>
                    </div>
                    <Switch 
                      checked={kitchenOpen} 
                      onCheckedChange={setKitchenOpen}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Featured Business</p>
                      <p className="text-sm text-gray-500">
                        Apply to be featured in promotions (additional fees may apply)
                      </p>
                    </div>
                    <Switch 
                      checked={isPromoted} 
                      onCheckedChange={setIsPromoted}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Business Hours Tab */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your business hours for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(availability).map(([dayName, { open, start, end }]) => {
                    const day = dayName as keyof Availability;
                    return (
                    <div key={dayName} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{dayName.charAt(0).toUpperCase() + dayName.slice(1)}</span>
                          <Switch 
                            checked={open} 
                            onCheckedChange={(checked) => handleDayToggle(day)}
                          />
                        </div>
                      </div>
                      <div className="col-span-9">
                        {open ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">From</span>
                            <Input 
                              type="time" 
                              value={start}
                              onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                              className="col-span-4"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <Input 
                              type="time" 
                              value={end}
                              onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                              className="col-span-4"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500">Closed</span>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Delivery Areas Tab */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Areas</CardTitle>
                <CardDescription>
                  Specify the areas where you offer delivery service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Service Areas */}
                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {serviceAreas.areas.map((area) => (
                        <Badge key={area} variant="secondary" className="py-1.5 px-3 flex gap-1 items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {area}
                          <button 
                            type="button"
                            className="ml-1 text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveServiceArea(area)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {serviceAreas.areas.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No service areas added yet</p>
                      )}
                    </div>
                    <div className="flex mt-2 gap-2">
                      <Input 
                        placeholder="Add service area (e.g., Andheri East, Bandra West)"
                        value={newServiceArea}
                        onChange={(e) => setNewServiceArea(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleAddServiceArea}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Add neighborhoods, areas, or pin codes where you deliver
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>
                  Showcase your kitchen, meals, and preparation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Gallery Images */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative h-48 rounded-lg overflow-hidden border">
                        <img 
                          src={image} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            onClick={() => handleRemoveGalleryImage(image)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add new image */}
                    <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                      <label 
                        htmlFor="gallery-upload" 
                        className="cursor-pointer text-center p-4 hover:bg-gray-50 rounded-md w-full h-full flex flex-col items-center justify-center"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium">Add Photo</span>
                        <span className="text-xs text-gray-500 mt-1">Upload an image</span>
                        <input 
                          id="gallery-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleGalleryImageChange}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {galleryUpload && (
                    <div className="flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      New image selected: {galleryUpload.name}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Showcase your kitchen, dishes, and cooking process. Max 10 images.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Social Media Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>
                  Connect your social media accounts and website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 flex items-center">
                        <Globe className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="website"
                        placeholder="www.yourwebsite.com"
                        value={socialMedia.website}
                        onChange={(e) => setSocialMedia({...socialMedia, website: e.target.value})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  {/* Instagram */}
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 flex items-center">
                        <Instagram className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="instagram"
                        placeholder="instagram_handle"
                        value={socialMedia.instagram}
                        onChange={(e) => setSocialMedia({...socialMedia, instagram: e.target.value})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  {/* Facebook */}
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 flex items-center">
                        <Facebook className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="facebook"
                        placeholder="facebook_page"
                        value={socialMedia.facebook}
                        onChange={(e) => setSocialMedia({...socialMedia, facebook: e.target.value})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  {/* Twitter */}
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 flex items-center">
                        <Twitter className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="twitter"
                        placeholder="twitter_handle"
                        value={socialMedia.twitter}
                        onChange={(e) => setSocialMedia({...socialMedia, twitter: e.target.value})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Tabs>
      
      {/* Verification Status Card */}
      {profile?.verification_status !== 'approved' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-yellow-800">Verification Status: {profile?.verification_status}</CardTitle>
                <CardDescription className="text-yellow-700">
                  {profile?.verification_status === 'pending' 
                    ? "Your seller account is under review. Some features may be limited until verification is complete." 
                    : "Your seller verification has been rejected. Please update your verification documents."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="default" 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => navigate('/seller/verification')}
            >
              Complete Verification
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SellerSettings;
