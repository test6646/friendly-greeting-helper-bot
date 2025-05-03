import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { SpiceButton } from '@/components/ui/spice-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, ImagePlus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createMeal, getSellerProfile } from '@/services/mealService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().min(3, 'Meal name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price_single: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  cuisine_type: z.string().min(1, 'Cuisine type is required'),
  preparation_time: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Preparation time must be a positive number'),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

const AddMeal: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasSellerProfile, setHasSellerProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price_single: '',
      category: '',
      cuisine_type: '',
      preparation_time: '',
      is_active: true,
      is_featured: false,
    },
  });

  useEffect(() => {
    const checkSellerProfile = async () => {
      if (!user) return;
      
      try {
        setCheckingProfile(true);
        const profile = await getSellerProfile(user.id);
        setHasSellerProfile(!!profile);
      } catch (error) {
        console.error("Error checking seller profile:", error);
        setHasSellerProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };
    
    checkSellerProfile();
  }, [user]);
  
  // Redirect to create profile if needed
  useEffect(() => {
    if (hasSellerProfile === false && !checkingProfile) {
      toast({
        title: "Profile Required",
        description: "You need to create a seller profile first",
        variant: "destructive"
      });
      navigate('/seller/create-profile');
    }
  }, [hasSellerProfile, checkingProfile, navigate, toast]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const newImages = [...images, ...selectedFiles].slice(0, 5); // Limit to 5 images
      setImages(newImages);
      
      // Create preview URLs
      const newImageUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(newImageUrls);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newImageUrls = [...imageUrls];
    URL.revokeObjectURL(newImageUrls[index]);
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
  };

  const uploadImages = async (sellerId: string): Promise<string[]> => {
    if (images.length === 0) return [];
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `meals/${sellerId}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('meal-images')
          .upload(filePath, file);
          
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
          .from('meal-images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrlData.publicUrl);
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add a meal",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      setIsSubmitting(true);
      
      // Get seller profile first to verify it exists
      const sellerProfile = await getSellerProfile(user.id);
      if (!sellerProfile) {
        toast({
          title: "Profile Required",
          description: "You need to create a seller profile first",
          variant: "destructive"
        });
        navigate('/seller/create-profile');
        return;
      }
      
      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(sellerProfile.id);
      }
      
      // Create meal object
      const mealData = {
        name: values.name,
        description: values.description,
        price_single: parseFloat(values.price_single),
        seller_id: user.id,
        category: values.category,
        cuisine_type: values.cuisine_type,
        preparation_time: parseFloat(values.preparation_time),
        is_active: values.is_active,
        is_featured: values.is_featured,
        images: imageUrls,
      };
      
      const newMeal = await createMeal(mealData);
      
      if (newMeal) {
        toast({
          title: "Meal created successfully",
          description: `${values.name} has been added to your menu`,
        });
        navigate('/seller/dashboard?tab=meals');
      }
    } catch (error: any) {
      console.error('Error creating meal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingProfile) {
    return (
      <Layout>
        <div className="container max-w-5xl py-6 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Checking your seller profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <SpiceButton 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </SpiceButton>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Meal</CardTitle>
            <CardDescription>Create a new meal to add to your menu</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Butter Chicken" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price_single"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)*</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="e.g. 299.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your meal in detail..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                            <SelectItem value="dessert">Dessert</SelectItem>
                            <SelectItem value="beverage">Beverage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cuisine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuisine Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cuisine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="chinese">Chinese</SelectItem>
                            <SelectItem value="italian">Italian</SelectItem>
                            <SelectItem value="mexican">Mexican</SelectItem>
                            <SelectItem value="thai">Thai</SelectItem>
                            <SelectItem value="japanese">Japanese</SelectItem>
                            <SelectItem value="middle_eastern">Middle Eastern</SelectItem>
                            <SelectItem value="american">American</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="preparation_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preparation Time (minutes)*</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="e.g. 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <Label>Meal Images (up to 5)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative rounded-md overflow-hidden h-24">
                        <img 
                          src={url} 
                          className="w-full h-full object-cover" 
                          alt={`Meal preview ${index + 1}`} 
                        />
                        <SpiceButton
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </SpiceButton>
                      </div>
                    ))}
                    
                    {imageUrls.length < 5 && (
                      <div className="border-2 border-dashed rounded-md flex items-center justify-center h-24">
                        <div className="text-center">
                          <ImagePlus className="mx-auto h-6 w-6 text-gray-400" />
                          <Label htmlFor="image-upload" className="cursor-pointer mt-2 text-sm text-saffron">
                            Add Image
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Make this meal available to customers
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Highlight this meal to attract more customers
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <SpiceButton 
                    type="submit" 
                    variant="primary"
                    className="w-full md:w-auto text-white font-medium py-2 px-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploadProgress > 0 && uploadProgress < 100 
                          ? `Uploading Images... ${uploadProgress}%` 
                          : 'Creating Meal...'
                        }
                      </>
                    ) : (
                      'Add Meal'
                    )}
                  </SpiceButton>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddMeal;
