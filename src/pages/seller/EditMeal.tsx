
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { getMealById, updateMeal } from '@/services/mealService';
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

const EditMeal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  
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
  
  // Fetch seller profile ID
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('seller_profiles')
          .select('id, verification_status')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching seller profile:', error);
          toast({
            title: "Error",
            description: "Could not verify seller permissions",
            variant: "destructive"
          });
          navigate('/seller/dashboard');
          return;
        }
        
        if (!data) {
          toast({
            title: "Seller profile not found",
            description: "You need to create a seller profile first",
            variant: "destructive"
          });
          navigate('/seller/create-profile');
          return;
        }
        
        // Check if seller is verified
        if (data.verification_status !== 'approved') {
          toast({
            title: "Verification Required",
            description: "Your seller account needs to be verified before editing meals",
            variant: "destructive"
          });
          navigate('/seller/verification');
          return;
        }
        
        setSellerProfileId(data.id);
      } catch (error) {
        console.error('Error in fetchSellerProfile:', error);
      }
    };
    
    fetchSellerProfile();
  }, [user, navigate, toast]);
  
  // Fetch meal details
  useEffect(() => {
    const fetchMeal = async () => {
      if (!id || !sellerProfileId) return;
      
      try {
        setIsLoading(true);
        const meal = await getMealById(id);
        
        if (!meal) {
          toast({
            title: "Meal not found",
            description: "The meal you're trying to edit doesn't exist",
            variant: "destructive"
          });
          navigate('/seller/dashboard?tab=meals');
          return;
        }
        
        // Check if current user is the owner of this meal
        if (meal.seller_id !== sellerProfileId) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this meal",
            variant: "destructive"
          });
          navigate('/seller/dashboard?tab=meals');
          return;
        }
        
        // Set form values
        form.reset({
          name: meal.name,
          description: meal.description || '',
          price_single: meal.price_single.toString(),
          category: meal.category || '',
          cuisine_type: meal.cuisine_type || '',
          preparation_time: meal.preparation_time?.toString() || '0',
          is_active: meal.is_active,
          is_featured: meal.is_featured,
        });
        
        // Set existing images
        setExistingImages(meal.images || []);
      } catch (error) {
        console.error('Error fetching meal details:', error);
        toast({
          title: "Error",
          description: "Failed to load meal details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMeal();
  }, [id, navigate, toast, form, sellerProfileId]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const totalImages = existingImages.length + images.length;
      const remainingSlots = 5 - totalImages;
      
      if (remainingSlots <= 0) {
        toast({
          title: "Maximum images reached",
          description: "You can upload a maximum of 5 images per meal",
          variant: "destructive"
        });
        return;
      }
      
      const newImages = [...images, ...selectedFiles].slice(0, remainingSlots);
      setImages(newImages);
      
      // Create preview URLs
      const newImageUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(newImageUrls);
    }
  };
  
  const removeNewImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newImageUrls = [...imageUrls];
    URL.revokeObjectURL(newImageUrls[index]);
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
  };
  
  const removeExistingImage = (index: number) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
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
    if (!id || !sellerProfileId) return;
    
    try {
      setIsSubmitting(true);
      
      // Upload new images
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        newImageUrls = await uploadImages(sellerProfileId);
      }
      
      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];
      
      // Create meal update object
      const mealData = {
        name: values.name,
        description: values.description,
        price_single: parseFloat(values.price_single),
        category: values.category,
        cuisine_type: values.cuisine_type,
        preparation_time: parseFloat(values.preparation_time),
        is_active: values.is_active,
        is_featured: values.is_featured,
        images: allImages,
        updated_at: new Date().toISOString(),
      };
      
      const updatedMeal = await updateMeal(id, mealData);
      
      if (updatedMeal) {
        toast({
          title: "Meal updated successfully",
          description: `${values.name} has been updated`,
        });
        navigate('/seller/dashboard?tab=meals');
      } else {
        throw new Error('Failed to update meal');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      toast({
        title: "Error",
        description: "Failed to update meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Meal</CardTitle>
            <CardDescription>Update your meal details</CardDescription>
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
                    {/* Existing Images */}
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative rounded-md overflow-hidden h-24">
                        <img 
                          src={url} 
                          className="w-full h-full object-cover" 
                          alt={`Meal preview ${index + 1}`} 
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                          onClick={() => removeExistingImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    
                    {/* New Images */}
                    {imageUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative rounded-md overflow-hidden h-24">
                        <img 
                          src={url} 
                          className="w-full h-full object-cover" 
                          alt={`New meal preview ${index + 1}`} 
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                          onClick={() => removeNewImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    
                    {(existingImages.length + imageUrls.length) < 5 && (
                      <div className="border-2 border-dashed rounded-md flex items-center justify-center h-24">
                        <div className="text-center">
                          <ImagePlus className="mx-auto h-6 w-6 text-gray-400" />
                          <Label htmlFor="image-upload" className="cursor-pointer mt-2 text-sm text-primary">
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
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploadProgress > 0 && uploadProgress < 100 
                          ? `Uploading Images... ${uploadProgress}%` 
                          : 'Updating Meal...'
                        }
                      </>
                    ) : (
                      'Update Meal'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditMeal;
