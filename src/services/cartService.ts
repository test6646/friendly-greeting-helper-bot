import { supabase } from "@/integrations/supabase/client";
import { Cart, CartItem } from "@/models/CartItem";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const useCart = (userId?: string) => {
  return useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // First get the cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (cartError && cartError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error code
        console.error('Error fetching cart:', cartError);
        throw cartError;
      }
      
      // If no cart exists yet, return null
      if (!cartData) return null;
      
      // Now get the cart items
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          *,
          meals (
            id,
            name,
            price_single,
            images,
            seller_id,
            seller_profiles (
              id,
              business_name,
              kitchen_open
            )
          )
        `)
        .eq('cart_id', cartData.id);
        
      if (itemsError) {
        console.error('Error fetching cart items:', itemsError);
        throw itemsError;
      }
      
      const items = itemsData.map((item: any) => ({
        id: item.id,
        mealId: item.meal_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        mealName: item.meals.name,
        mealImage: item.meals.images?.[0] || '',
        sellerName: item.meals.seller_profiles.business_name,
        sellerId: item.meals.seller_profiles.id,
        sellerKitchenOpen: item.meals.seller_profiles.kitchen_open,
        deliveryDate: item.delivery_date,
        subscription: item.subscription
      } as CartItem));
      
      return {
        id: cartData.id,
        userId: cartData.user_id,
        items,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        deliveryFee: cartData.delivery_fee,
        total: cartData.total,
        createdAt: cartData.created_at,
        updatedAt: cartData.updated_at
      } as Cart;
    },
    enabled: !!userId
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId, 
      mealId, 
      quantity, 
      subscription = null
    }: { 
      userId: string; 
      mealId: string; 
      quantity: number; 
      subscription?: { type: 'weekly' | 'monthly' | null; days?: string[]; duration?: number; } | null;
    }) => {
      // First get the meal to get its price
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .single();
        
      if (mealError) {
        console.error('Error fetching meal:', mealError);
        throw mealError;
      }
      
      // Check if user already has a cart
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
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
            user_id: userId,
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
      
      // Calculate price based on subscription type
      let price = meal.price_single;
      if (subscription?.type === 'weekly' && meal.price_weekly) {
        price = meal.price_weekly;
      } else if (subscription?.type === 'monthly' && meal.price_monthly) {
        price = meal.price_monthly;
      }
      
      const subtotal = price * quantity;
      
      // Check if the meal is already in the cart
      const { data: existingItem, error: itemCheckError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('meal_id', mealId)
        .maybeSingle();
        
      if (itemCheckError) {
        console.error('Error checking for existing item:', itemCheckError);
        throw itemCheckError;
      }
      
      let result;
      
      // If item already exists, update quantity
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newSubtotal = price * newQuantity;
        
        const { data, error } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            subtotal: newSubtotal,
            subscription
          })
          .eq('id', existingItem.id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Otherwise add new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            meal_id: mealId,
            quantity,
            price,
            subtotal,
            subscription
          })
          .select()
          .single();
          
        if (error) {
          console.error('Error adding item to cart:', error);
          throw error;
        }
        
        result = data;
      }
      
      // Update cart totals
      await updateCartTotals(cartId);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] });
      toast({
        title: "Added to cart successfully",
        description: "Item has been added to your cart."
      });
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      itemId, 
      quantity 
    }: { 
      userId: string; 
      itemId: string; 
      quantity: number;
    }) => {
      // First get the current item to get price
      const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select('*, cart:cart_id(user_id)')
        .eq('id', itemId)
        .single();
        
      if (itemError) {
        console.error('Error fetching cart item:', itemError);
        throw itemError;
      }
      
      // Security check
      if (item.cart.user_id !== userId) {
        throw new Error('Unauthorized');
      }
      
      // Calculate new subtotal
      const subtotal = item.price * quantity;
      
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          subtotal
        })
        .eq('id', itemId);
        
      if (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
      
      // Update cart totals
      await updateCartTotals(item.cart_id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] });
    },
    onError: (error) => {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart item');
    }
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      itemId 
    }: { 
      userId: string; 
      itemId: string;
    }) => {
      // First get the current item to get cart_id
      const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select('*, cart:cart_id(user_id)')
        .eq('id', itemId)
        .single();
        
      if (itemError) {
        console.error('Error fetching cart item:', itemError);
        throw itemError;
      }
      
      // Security check
      if (item.cart.user_id !== userId) {
        throw new Error('Unauthorized');
      }
      
      const cartId = item.cart_id;
      
      // Remove the item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
        
      if (error) {
        console.error('Error removing cart item:', error);
        throw error;
      }
      
      // Update cart totals
      await updateCartTotals(cartId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] });
      toast({
        title: "Success",
        description: "Item removed from cart"
      });
    },
    onError: (error) => {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  });
};

// Helper function to update cart totals
const updateCartTotals = async (cartId: string) => {
  // Get all cart items for this cart
  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select('subtotal')
    .eq('cart_id', cartId);
    
  if (itemsError) {
    console.error('Error fetching cart items for total update:', itemsError);
    throw itemsError;
  }
  
  // Calculate subtotal - make sure items is treated as an array
  const subtotal = Array.isArray(items) 
    ? items.reduce((sum, item) => sum + (typeof item.subtotal === 'number' ? item.subtotal : 0), 0)
    : 0;
  
  // Calculate tax (e.g., 5% tax rate)
  const tax = subtotal * 0.05;
  
  // Calculate delivery fee (e.g., flat fee or based on items count)
  const deliveryFee = Array.isArray(items) && items.length > 0 ? 40 : 0; // ₹40 delivery fee
  
  // Calculate total
  const total = subtotal + tax + deliveryFee;
  
  // Update cart
  const { error } = await supabase
    .from('carts')
    .update({
      subtotal,
      tax,
      delivery_fee: deliveryFee,
      total
    })
    .eq('id', cartId);
    
  if (error) {
    console.error('Error updating cart totals:', error);
    throw error;
  }
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // First get the cart id
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (cartError) {
        if (cartError.code === 'PGRST116') {
          // No cart exists, nothing to clear
          return;
        }
        console.error('Error fetching cart for clearing:', cartError);
        throw cartError;
      }
      
      // Remove all items
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      if (error) {
        console.error('Error clearing cart items:', error);
        throw error;
      }
      
      // Update cart totals
      await supabase
        .from('carts')
        .update({
          subtotal: 0,
          tax: 0,
          delivery_fee: 0,
          total: 0
        })
        .eq('id', cart.id);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
      toast({
        title: "Success",
        description: "Cart cleared successfully"
      });
    },
    onError: (error) => {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive"
      });
    }
  });
};

// Function to checkout - this would create an order from the cart
export const useCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      addressId, 
      paymentMethodId 
    }: { 
      userId: string; 
      addressId: string;
      paymentMethodId: string;
    }) => {
      // Get the cart with items
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
            meals (
              id,
              name,
              seller_id
            )
          )
        `)
        .eq('user_id', userId)
        .single();
        
      if (cartError) {
        console.error('Error fetching cart for checkout:', cartError);
        throw cartError;
      }
      
      // Group items by seller, ensure cart.cart_items is an array
      const itemsBySeller = Array.isArray(cart.cart_items) 
        ? cart.cart_items.reduce((groups: Record<string, any[]>, item: any) => {
            const sellerId = item.meals?.seller_id;
            if (sellerId && !groups[sellerId]) {
              groups[sellerId] = [];
            }
            if (sellerId) {
              groups[sellerId].push(item);
            }
            return groups;
          }, {})
        : {};
      
      // Create an order for each seller
      const orderPromises = Object.entries(itemsBySeller).map(async ([sellerId, items]: [string, any[]]) => {
        // Calculate order subtotal for this seller
        const subtotal = items.reduce((sum: number, item: any) => sum + (typeof item.subtotal === 'number' ? item.subtotal : 0), 0);
        const tax = subtotal * 0.05;
        const deliveryFee = 40;
        const total = subtotal + tax + deliveryFee;
        
        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            seller_id: sellerId,
            address_id: addressId,
            payment_method_id: paymentMethodId,
            subtotal,
            tax,
            delivery_fee: deliveryFee,
            total,
            status: 'pending',
            payment_status: 'pending'
          })
          .select()
          .single();
          
        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }
        
        // Create order items
        const orderItems = Array.isArray(items) 
          ? items.map((item: any) => ({
              order_id: order.id,
              meal_id: item.meal_id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              subscription: item.subscription
            }))
          : [];
        
        // Create order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw itemsError;
        }
        
        // Create a notification for the seller
        await supabase
          .from('notifications')
          .insert({
            user_id: sellerId,
            title: 'New Order Received',
            message: `You have received a new order for ${items.length} item(s).`,
            type: 'order',
            related_entity_id: order.id,
            is_read: false
          });
          
        // Create a notification for the buyer
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Order Placed Successfully',
            message: `Your order for ${items.length} item(s) has been placed successfully.`,
            type: 'order',
            related_entity_id: order.id,
            is_read: false
          });
          
        return order;
      });
      
      const orders = await Promise.all(orderPromises);
      
      // Clear the cart after successful checkout
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      await supabase
        .from('carts')
        .update({
          subtotal: 0,
          tax: 0,
          delivery_fee: 0,
          total: 0
        })
        .eq('id', cart.id);
        
      return orders;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
      toast({
        title: "Order placed successfully!",
        description: "Your order has been successfully placed and is being processed."
      });
    },
    onError: (error) => {
      console.error('Error during checkout:', error);
      toast({
        title: "Checkout failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  });
};
