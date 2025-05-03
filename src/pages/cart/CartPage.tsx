import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useCheckout } from '@/services/cartService';
import { Loader2, ShoppingCart, Trash, Plus, Minus, CreditCard, MapPin, ArrowRight, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const CartPage = () => {
  const { user } = useAuth();
  const { data: cart, isLoading, error, refetch } = useCart(user?.id);
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const checkout = useCheckout();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  useEffect(() => {
    // Clean up old checkout errors when dialog opens/closes
    setCheckoutError(null);
  }, [isCheckoutDialogOpen]);
  
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingAddresses(true);
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
          
        if (error) {
          console.error('Error fetching addresses:', error);
          return;
        }
        
        setAddresses(data || []);
        // Auto-select default address if available
        const defaultAddress = data?.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data && data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      } catch (error) {
        console.error('Error in fetchAddresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    
    if (isCheckoutDialogOpen) {
      fetchAddresses();
    }
  }, [user?.id, isCheckoutDialogOpen]);
  
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (user?.id) {
      updateCartItem.mutate(
        { userId: user.id, itemId, quantity: newQuantity },
        {
          onSuccess: () => {
            refetch();
          },
          onError: (error) => {
            console.error('Error updating quantity:', error);
            toast({
              title: "Failed to update quantity",
              description: "Please try again later",
              variant: "destructive",
            });
          }
        }
      );
    }
  };
  
  const handleRemoveItem = (itemId: string) => {
    if (user?.id) {
      removeFromCart.mutate(
        { userId: user.id, itemId },
        {
          onSuccess: () => {
            toast({
              title: "Item removed",
              description: "Item has been removed from your cart",
            });
            refetch();
          },
          onError: (error) => {
            console.error('Error removing item:', error);
            toast({
              title: "Failed to remove item",
              description: "Please try again later",
              variant: "destructive",
            });
          }
        }
      );
    }
  };
  
  const handleClearCart = () => {
    if (user?.id) {
      clearCart.mutate(
        user.id,
        {
          onSuccess: () => {
            toast({
              title: "Cart cleared",
              description: "All items have been removed from your cart",
            });
            refetch();
          },
          onError: (error) => {
            console.error('Error clearing cart:', error);
            toast({
              title: "Failed to clear cart",
              description: "Please try again later",
              variant: "destructive",
            });
          }
        }
      );
    }
  };
  
  const validateCheckout = () => {
    // Reset previous errors
    setCheckoutError(null);
    
    // Check if cart has items
    if (!cart || cart.items.length === 0) {
      setCheckoutError("Your cart is empty");
      return false;
    }
    
    // Check if address is selected
    if (!selectedAddressId) {
      setCheckoutError("Please select a delivery address");
      return false;
    }
    
    // Check if payment method is selected
    if (!selectedPaymentMethod) {
      setCheckoutError("Please select a payment method");
      return false;
    }
    
    // Check if any seller has closed their kitchen
    const hasClosedKitchen = cart.items.some(item => 
      item.sellerKitchenOpen === false
    );
    
    if (hasClosedKitchen) {
      setCheckoutError("Some sellers have closed their kitchens. Please remove those items to continue.");
      return false;
    }
    
    return true;
  };
  
  const handleCheckout = () => {
    if (!validateCheckout()) {
      return;
    }
    
    if (user?.id) {
      checkout.mutate(
        {
          userId: user.id,
          addressId: selectedAddressId,
          paymentMethodId: selectedPaymentMethod
        },
        {
          onSuccess: (data) => {
            setIsCheckoutDialogOpen(false);
            toast({
              title: "Order placed successfully",
              description: "Your order has been placed and will be processed shortly",
            });
            navigate('/orders');
          },
          onError: (error: any) => {
            console.error('Error placing order:', error);
            setCheckoutError(error.message || "Failed to place order. Please try again.");
          }
        }
      );
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sign in to view your cart</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to view your cart and place orders
              </p>
              <Button asChild size="lg">
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Your Cart</h1>
          
          {cart && cart.items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearCart}
              disabled={clearCart.isPending}
            >
              {clearCart.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Clear cart
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load your cart. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          </div>
        ) : cart && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full sm:w-1/4 h-40">
                          {item.mealImage ? (
                            <img 
                              src={item.mealImage} 
                              alt={item.mealName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {item.sellerKitchenOpen === false && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                                Kitchen Closed
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 p-4">
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <div className="flex justify-between">
                                <h3 className="font-medium text-lg">{item.mealName}</h3>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={removeFromCart.isPending}
                                >
                                  {removeFromCart.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                By {item.sellerName}
                              </p>
                              
                              {item.subscription?.type && (
                                <div className="mt-1">
                                  <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">
                                    {item.subscription.type.charAt(0).toUpperCase() + item.subscription.type.slice(1)} Plan
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-end justify-between mt-4">
                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={updateCartItem.isPending || item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <span className="w-10 text-center font-medium">
                                  {item.quantity}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={updateCartItem.isPending}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(item.price)} × {item.quantity}
                                </p>
                                <p className="font-semibold text-primary">
                                  {formatCurrency(item.subtotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cart.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>{formatCurrency(cart.tax)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{formatCurrency(cart.deliveryFee)}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(cart.total)}</span>
                    </div>
                  </div>
                  
                  <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-6">
                        Proceed to Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <div>
                        <DialogHeader>
                          <DialogTitle>Complete your order</DialogTitle>
                          <DialogDescription>
                            Select your delivery address and payment method to complete your order.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {checkoutError && (
                          <Alert variant="destructive" className="my-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{checkoutError}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="space-y-6 py-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Delivery Address
                            </h4>
                            
                            {loadingAddresses ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading addresses...</span>
                              </div>
                            ) : addresses.length > 0 ? (
                              <RadioGroup 
                                value={selectedAddressId} 
                                onValueChange={setSelectedAddressId}
                                className="grid grid-cols-1 gap-2"
                              >
                                {addresses.map(address => (
                                  <div key={address.id} className="flex items-start space-x-2 border rounded-md p-3">
                                    <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                                    <div>
                                      <Label htmlFor={`address-${address.id}`} className="font-medium">{address.type}</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {address.line1}
                                        {address.line2 ? `, ${address.line2}` : ''}, 
                                        {address.city}, {address.state} {address.postal_code}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div className="text-center py-4 border rounded-md">
                                <p className="text-muted-foreground mb-2">No addresses found</p>
                              </div>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 w-full"
                              asChild
                            >
                              <Link to="/addresses">Add New Address</Link>
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Payment Method
                            </h4>
                            
                            <RadioGroup 
                              value={selectedPaymentMethod} 
                              onValueChange={setSelectedPaymentMethod}
                              className="grid grid-cols-1 gap-2"
                            >
                              <div className="flex items-center space-x-2 border rounded-md p-3">
                                <RadioGroupItem value="cod" id="cod" />
                                <Label htmlFor="cod">Cash on Delivery</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2 border rounded-md p-3">
                                <RadioGroupItem value="online" id="online" />
                                <Label htmlFor="online">Online Payment</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsCheckoutDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          
                          <Button 
                            onClick={handleCheckout}
                            disabled={checkout.isPending || !selectedAddressId || !selectedPaymentMethod}
                            className="gap-2"
                          >
                            {checkout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Place Order
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
                <CardFooter className="bg-muted/20 px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-1">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">
              Looks like you haven't added any meals to your cart yet.
            </p>
            <Button asChild>
              <Link to="/meals">Browse Meals</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
