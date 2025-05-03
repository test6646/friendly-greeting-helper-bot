
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Meal } from '@/services/mealService';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/services/cartService';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, ShoppingCart, Plus } from 'lucide-react';
import { SellerProfileSimplified } from '@/interfaces/supabase';

const MealsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  
  const { data: cartData } = useCart(user?.id);
  const queryClient = useQueryClient();

  // Type guard to check if seller_profiles has valid properties
  const isValidSellerProfile = (obj: any): obj is SellerProfileSimplified => {
    return obj && 
           typeof obj === 'object' && 
           !('error' in obj) &&
           'verification_status' in obj &&
           'kitchen_open' in obj;
  };

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        
        // Fetch all active meals from all verified sellers
        const { data, error } = await supabase
          .from('meals')
          .select(`
            *,
            seller_profiles:seller_id (
              id,
              business_name,
              business_description,
              verification_status,
              kitchen_open
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching meals:', error);
          throw error;
        }
        
        // Filter to include only meals from verified sellers with open kitchens
        const validMeals = data.filter(meal => 
          isValidSellerProfile(meal.seller_profiles) && 
          meal.seller_profiles.verification_status !== 'rejected' &&
          meal.seller_profiles.kitchen_open === true
        );
        
        console.log('Fetched meals:', validMeals);
        setMeals(validMeals as unknown as Meal[]);
        setFilteredMeals(validMeals as unknown as Meal[]);
      } catch (error: any) {
        console.error('Error in fetchMeals:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load meals",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeals();
  }, [toast]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMeals(meals);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = meals.filter(meal => 
        meal.name.toLowerCase().includes(query) || 
        meal.description?.toLowerCase().includes(query) ||
        meal.cuisine_type?.toLowerCase().includes(query) ||
        // Add null check before accessing business_name
        (isValidSellerProfile(meal.seller_profiles) && 
         meal.seller_profiles.business_name && 
         meal.seller_profiles.business_name.toLowerCase().includes(query))
      );
      setFilteredMeals(filtered);
    }
  }, [searchQuery, meals]);

  const handleAddToCart = async (meal: Meal) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your cart",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingToCart(prev => ({ ...prev, [meal.id]: true }));
      
      // First get the meal to get its price
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', meal.id)
        .single();
        
      if (mealError) {
        console.error('Error fetching meal:', mealError);
        throw mealError;
      }
      
      // Check if user already has a cart
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (cartError && cartError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
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
      
      const price = mealData.price_single;
      const quantity = 1;
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
        const newQuantity = existingItem.quantity + 1;
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
      
      // Update cart totals by recalculating from items
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
        description: `${meal.name} has been added to your cart`
      });
      
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(prev => ({ ...prev, [meal.id]: false }));
    }
  };

  const handleBuyNow = async (meal: Meal) => {
    try {
      await handleAddToCart(meal);
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
            <span className="ml-2 text-lg">Loading meals...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Explore Meals</h1>
          <p className="text-muted-foreground">Discover delicious homemade meals from verified home chefs</p>
        </div>
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search meals, cuisine types, or sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {filteredMeals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/30 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No meals found</h3>
              <p className="text-muted-foreground mt-1">
                We couldn't find any meals matching your search.
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {meal.images && meal.images.length > 0 ? (
                    <img 
                      src={meal.images[0]}
                      alt={meal.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/30">
                      <p className="text-muted-foreground">No image</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div>
                    <Link to={`/meals/${meal.id}`}>
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                        {meal.name}
                      </h3>
                    </Link>
                    {/* Safe access to seller_profiles */}
                    <p className="text-sm text-muted-foreground mt-1">
                      By {isValidSellerProfile(meal.seller_profiles) ? 
                          meal.seller_profiles.business_name : "Unknown Seller"}
                    </p>
                    
                    {meal.cuisine_type && (
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {meal.cuisine_type}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-medium">₹{meal.price_single}</span>
                      {meal.discount_percent > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{(meal.price_single / (1 - meal.discount_percent / 100)).toFixed(2)}
                        </span>
                      )}
                      {meal.discount_percent > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          {meal.discount_percent}% off
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddToCart(meal)}
                        disabled={addingToCart[meal.id]}
                      >
                        {addingToCart[meal.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4 mr-2" />
                        )}
                        Add to Cart
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={() => handleBuyNow(meal)}
                        disabled={addingToCart[meal.id]}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MealsPage;
