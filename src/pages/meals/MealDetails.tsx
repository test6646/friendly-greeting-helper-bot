import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/services/cartService';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ChefHat, Clock, ShoppingCart, Star, ArrowLeft } from 'lucide-react';

const MealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchMeal = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('meals')
          .select(`
            *,
            seller_profiles:seller_id (
              id,
              business_name,
              business_description,
              rating,
              rating_count,
              verification_status,
              cuisine_types
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching meal:', error);
          throw error;
        }
        
        console.log('Fetched meal details:', data);
        setMeal(data);
        
        // Set the first image as selected if available
        if (data.images && data.images.length > 0) {
          setSelectedImage(0);
        }
      } catch (error: any) {
        console.error('Error in fetchMeal:', error);
        toast({
          title: "Error",
          description: "Failed to load meal details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeal();
  }, [id, toast]);

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your cart",
        variant: "destructive"
      });
      return;
    }
    
    if (!meal) return;
    
    try {
      setAdding(true);
      
      // Check if user already has a cart
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (cartError && cartError.code !== 'PGRST116') {
        console.error('Error checking for existing cart:', cartError);
        throw cartError;
      }
      
      let cartId = existingCart?.id;
      
      // If no cart exists, create one
      if (!cartId) {
        const { data: newCart, error: createCartError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            subtotal: 0,
            tax: 0,
            delivery_fee: 0,
            total: 0
          })
          .select()
          .single();
          
        if (createCartError) {
          console.error('Error creating cart:', createCartError);
          throw createCartError;
        }
        
        cartId = newCart.id;
      }
      
      const price = meal.price_single;
      const subtotal = price * quantity;
      
      // Check if the meal is already in the cart
      const { data: existingItem, error: itemCheckError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('meal_id', meal.id)
        .maybeSingle();
        
      if (itemCheckError) {
        console.error('Error checking for existing item:', itemCheckError);
        throw itemCheckError;
      }
      
      // If item already exists, update quantity
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newSubtotal = price * newQuantity;
        
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            subtotal: newSubtotal
          })
          .eq('id', existingItem.id);
          
        if (updateError) {
          console.error('Error updating cart item:', updateError);
          throw updateError;
        }
      } else {
        // Otherwise add new item
        const { error: addError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            meal_id: meal.id,
            quantity: quantity,
            price: price,
            subtotal: subtotal
          });
          
        if (addError) {
          console.error('Error adding item to cart:', addError);
          throw addError;
        }
      }
      
      // Update cart totals
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('subtotal')
        .eq('cart_id', cartId);
        
      if (itemsError) {
        console.error('Error fetching cart items for total update:', itemsError);
        throw itemsError;
      }
      
      // Calculate subtotal
      const subtotalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Calculate tax (e.g., 5% tax rate)
      const taxAmount = subtotalAmount * 0.05;
      
      // Calculate delivery fee
      const deliveryFeeAmount = cartItems.length > 0 ? 40 : 0; // ₹40 delivery fee
      
      // Calculate total
      const totalAmount = subtotalAmount + taxAmount + deliveryFeeAmount;
      
      // Update cart
      const { error: cartUpdateError } = await supabase
        .from('carts')
        .update({
          subtotal: subtotalAmount,
          tax: taxAmount,
          delivery_fee: deliveryFeeAmount,
          total: totalAmount
        })
        .eq('id', cartId);
        
      if (cartUpdateError) {
        console.error('Error updating cart totals:', cartUpdateError);
        throw cartUpdateError;
      }
      
      // Invalidate query cache to refresh cart data
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      
      toast({
        title: "Added to cart",
        description: `${quantity} ${quantity > 1 ? 'items' : 'item'} added to your cart`
      });
      
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      await handleAddToCart();
      // Navigate to cart page
      window.location.href = '/cart';
    } catch (error) {
      console.error('Error in buy now flow:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading meal details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!meal) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Meal not found</h2>
            <p className="mt-2">The meal you're looking for doesn't exist or has been removed.</p>
            <Link to="/meals">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Meals
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link to="/meals" className="text-sm text-muted-foreground hover:text-primary flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meals
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              {meal.images && meal.images.length > 0 ? (
                <img 
                  src={meal.images[selectedImage]}
                  alt={meal.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/30">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
            
            {meal.images && meal.images.length > 1 && (
              <div className="flex overflow-x-auto gap-2 pb-2">
                {meal.images.map((image: string, index: number) => (
                  <div 
                    key={index}
                    className={`cursor-pointer border-2 rounded-md overflow-hidden flex-shrink-0 w-20 h-20 transition-all
                      ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${meal.name} thumbnail ${index + 1}`} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right: Details */}
          <div>
            <h1 className="text-3xl font-bold">{meal.name}</h1>
            
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{meal.rating || 'New'}</span>
                {meal.rating_count > 0 && (
                  <span className="text-muted-foreground ml-1">({meal.rating_count} ratings)</span>
                )}
              </div>
              
              <span className="mx-2">•</span>
              
              <Link to={`/seller/${meal.seller_profiles.id}`} className="text-primary hover:underline">
                {meal.seller_profiles.business_name}
              </Link>
            </div>
            
            <div className="mt-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">₹{meal.price_single}</span>
                {meal.discount_percent > 0 && (
                  <>
                    <span className="ml-2 text-lg text-muted-foreground line-through">
                      ₹{(meal.price_single / (1 - meal.discount_percent / 100)).toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-green-600 font-medium">
                      {meal.discount_percent}% off
                    </span>
                  </>
                )}
              </div>
              
              {meal.preparation_time && (
                <div className="flex items-center mt-4">
                  <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                  <span>Preparation time: {meal.preparation_time} minutes</span>
                </div>
              )}
            </div>
            
            {/* Add to Cart Section */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <span className="mr-4">Quantity:</span>
                <div className="flex border rounded-md">
                  <button 
                    className="px-3 py-1 border-r"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="px-4 py-1">{quantity}</span>
                  <button 
                    className="px-3 py-1 border-l"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Add to Cart
                </Button>
                <Button 
                  className="w-full"
                  onClick={handleBuyNow}
                  disabled={adding}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs for Details */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="seller">About Seller</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="p-4 border rounded-md mt-4">
              <div>
                <p className="text-gray-700">
                  {meal.description || "No description provided"}
                </p>
                
                {meal.cuisine_type && (
                  <div className="mt-4">
                    <h3 className="font-medium">Cuisine Type</h3>
                    <p>{meal.cuisine_type}</p>
                  </div>
                )}
                
                {meal.dietary_info && Object.keys(meal.dietary_info).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium">Dietary Information</h3>
                    <ul className="mt-2 list-disc pl-5">
                      {Object.entries(meal.dietary_info).map(([key, value]) => (
                        <li key={key}>
                          {key}: {String(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {meal.nutritional_info && Object.keys(meal.nutritional_info).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium">Nutritional Information</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {Object.entries(meal.nutritional_info).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-2 rounded">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ingredients" className="p-4 border rounded-md mt-4">
              {meal.ingredients && meal.ingredients.length > 0 ? (
                <ul className="list-disc pl-5">
                  {meal.ingredients.map((ingredient: string, index: number) => (
                    <li key={index} className="mb-1">{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <p>No ingredient information available</p>
              )}
            </TabsContent>
            
            <TabsContent value="seller" className="p-4 border rounded-md mt-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{meal.seller_profiles.business_name}</h3>
                  
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{meal.seller_profiles.rating || 'New'}</span>
                    {meal.seller_profiles.rating_count > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({meal.seller_profiles.rating_count} ratings)
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 text-gray-700">
                    {meal.seller_profiles.business_description || "No seller description available."}
                  </p>
                  
                  {meal.seller_profiles.cuisine_types && meal.seller_profiles.cuisine_types.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium">Specializes in:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {meal.seller_profiles.cuisine_types.map((cuisine: string, index: number) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                          >
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default MealDetails;
