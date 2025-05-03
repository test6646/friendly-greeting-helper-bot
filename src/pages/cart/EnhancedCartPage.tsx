
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, ArrowRight, Minus, Plus, Trash } from 'lucide-react';
import OrderPlacement from '@/components/order/OrderPlacement';
import { CartItem } from '@/models/CartItem';
import { Link, useNavigate } from 'react-router-dom';

// Import the cart service functionality
import { useCart, useRemoveFromCart, useUpdateCartItem } from '@/services/cartService';
import { useIsMobile } from '@/hooks/use-mobile';

// Touch-friendly cart quantity component
const CartQuantityControl: React.FC<{
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isMobile: boolean;
}> = ({ quantity, onIncrement, onDecrement, isMobile }) => {
  // Reasonable touch target sizes for mobile
  const buttonSize = isMobile ? "h-10 w-10" : "h-9 w-9";
  const iconSize = isMobile ? 16 : 14;
  
  return (
    <div className="flex items-center border rounded-md shadow-sm">
      <button 
        className={`${buttonSize} flex items-center justify-center border-r hover:bg-muted/50`}
        onClick={onDecrement}
        aria-label="Decrease quantity"
      >
        <Minus size={iconSize} />
      </button>
      <span className={`px-4 py-2 min-w-[40px] text-center font-medium`}>{quantity}</span>
      <button 
        className={`${buttonSize} flex items-center justify-center border-l hover:bg-muted/50`}
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
};

const EnhancedCartPage = () => {
  const { user, loading } = useSimpleAuth(); // Use SimpleAuthContext instead of AuthContext
  const { data: cart, isLoading, refetch } = useCart(user?.id);
  const [activeTab, setActiveTab] = useState<string>("cart");
  const removeFromCart = useRemoveFromCart();
  const updateCartItem = useUpdateCartItem();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in Cart:", { user, loading });
  }, [user, loading]);
  
  // Ensure cart data is refreshed when component loads
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);
  
  // Custom navigation function to prevent React.Children.only error
  const navigateTo = (path: string) => {
    navigate(path);
  };
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto py-10 md:py-16 px-4 md:px-6">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="ml-4 text-lg">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Only show login prompt if we're definitely not authenticated
  if (!loading && !user) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto py-10 md:py-16 px-4 md:px-6">
          <div className="text-center py-16 md:py-24 bg-muted/20 rounded-xl shadow-sm">
            <ShoppingCart className="h-16 w-16 md:h-20 md:w-20 mx-auto text-muted-foreground" />
            <h2 className="mt-6 text-2xl md:text-3xl font-bold">Your cart is waiting!</h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              Please log in to view your cart and place orders.
            </p>
            <div className="mt-8">
              <Button 
                size="default" 
                className="px-6"
                onClick={() => navigateTo('/auth')}
              >
                Login to Continue
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax || 0;
  const deliveryFee = cart?.deliveryFee || 0; 
  const total = cart?.total || 0;
  
  const handleCheckout = () => {
    setActiveTab("checkout");
  };

  const handleOrderSuccess = () => {
    // Refresh cart data
    refetch();
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (!user) return;
    if (newQuantity <= 0) {
      removeFromCart.mutate({ userId: user.id, itemId });
    } else {
      updateCartItem.mutate({ userId: user.id, itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!user) return;
    removeFromCart.mutate({ userId: user.id, itemId });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 md:px-6">
        <Tabs defaultValue="cart" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Your Cart</h1>
              {cartItems.length > 0 && (
                <p className="text-muted-foreground mt-2 text-base md:text-lg">
                  You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                </p>
              )}
            </div>
            
            <TabsList className="mt-4 md:mt-0 w-full md:w-auto bg-background/80 backdrop-blur border">
              <TabsTrigger value="cart" className="text-base py-2 px-4">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
              </TabsTrigger>
              <TabsTrigger value="checkout" disabled={cartItems.length === 0} className="text-base py-2 px-4">
                <Package className="h-4 w-4 mr-2" />
                Checkout
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cart" className="pt-2 focus:outline-none">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-6 text-lg text-muted-foreground">Loading your cart...</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16 md:py-24 bg-muted/20 rounded-xl shadow-sm">
                <ShoppingCart className="h-16 w-16 md:h-24 md:w-24 mx-auto text-muted-foreground" />
                <h2 className="mt-6 text-2xl md:text-3xl font-bold">Your cart is empty</h2>
                <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <div className="mt-8">
                  <Button 
                    size="default" 
                    className="px-6"
                    onClick={() => navigateTo('/meals')}
                  >
                    Browse Meals
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-6 border rounded-xl p-6 bg-card/80 backdrop-blur shadow-sm">
                      <div className="md:w-1/4 h-32 md:h-40 rounded-lg overflow-hidden">
                        <img 
                          src={item.mealImage || '/placeholder.svg'} 
                          alt={item.mealName} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-xl md:text-2xl">{item.mealName}</h3>
                            <p className="font-bold text-xl md:text-2xl">₹{item.subtotal.toFixed(2)}</p>
                          </div>
                          <p className="text-muted-foreground text-base mt-1">
                            By: {item.sellerName}
                          </p>
                          {item.subscription && (
                            <p className="text-sm md:text-base text-primary mt-2 inline-block bg-primary/10 px-3 py-1 rounded-full">
                              {item.subscription.type === 'weekly' ? 'Weekly' : 'Monthly'} subscription
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                          <CartQuantityControl
                            quantity={item.quantity}
                            onDecrement={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            onIncrement={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            isMobile={isMobile}
                          />
                          <Button 
                            variant="outline" 
                            size="default"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-base border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cart Summary */}
                <div className="border rounded-xl p-6 space-y-3 bg-card/80 backdrop-blur shadow-sm mt-8">
                  <div className="flex justify-between text-base md:text-lg">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base md:text-lg">
                    <span>Tax</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base md:text-lg">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4 mt-3 flex justify-between font-semibold text-lg md:text-xl">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <div className="flex justify-end mt-8">
                  <Button 
                    onClick={handleCheckout} 
                    className="bg-primary hover:bg-primary/90 text-white px-6"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkout">
            <OrderPlacement 
              cartItems={cartItems as CartItem[]}
              subtotal={subtotal}
              tax={tax}
              deliveryFee={deliveryFee}
              total={total}
              onOrderSuccess={handleOrderSuccess}
            />
            
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setActiveTab("cart")}
                className="text-base px-6"
              >
                Back to Cart
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EnhancedCartPage;
