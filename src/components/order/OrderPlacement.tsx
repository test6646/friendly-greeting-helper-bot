
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, CreditCard, Plus, AlertCircle, Check, ShoppingBag } from 'lucide-react';
import { createOrderNotifications } from '@/services/enhancedNotificationService';
import { CartItem } from '@/models/CartItem';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderPlacementProps {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  onOrderSuccess?: () => void;
}

interface Address {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  type: string;
  is_default: boolean;
}

const OrderPlacement: React.FC<OrderPlacementProps> = ({
  cartItems,
  subtotal,
  tax,
  deliveryFee,
  total,
  onOrderSuccess
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
          
        if (error) throw error;
        
        setAddresses(data || []);
        
        // Set default address if available
        if (data && data.length > 0) {
          const defaultAddress = data.find(addr => addr.is_default);
          setSelectedAddressId(defaultAddress ? defaultAddress.id : data[0].id);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast({
          title: 'Failed to load addresses',
          variant: 'destructive'
        });
      }
    };
    
    fetchAddresses();
  }, [user]);

  // Check if cart items are from the same seller
  const sellerId = cartItems.length > 0 ? cartItems[0].sellerId : null;
  const isSingleSeller = cartItems.every(item => item.sellerId === sellerId);
  
  if (!isSingleSeller) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-base">Mixed sellers in cart</AlertTitle>
        <AlertDescription className="text-sm">
          You can only place an order from a single seller at a time. Please update your cart.
        </AlertDescription>
      </Alert>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to place an order',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    if (!selectedAddressId) {
      toast({
        title: 'Address required',
        description: 'Please select a delivery address',
        variant: 'destructive'
      });
      return;
    }
    
    if (!sellerId) {
      toast({
        title: 'Error',
        description: 'No seller information found',
        variant: 'destructive'
      });
      return;
    }

    // Reset error state
    setErrorMessage(null);

    try {
      setLoading(true);
      console.log("Starting order placement...");
      
      // Generate a proper UUID for the payment method instead of using "cod" string
      const paymentMethodId = crypto.randomUUID();
      console.log("Generated payment method ID:", paymentMethodId);
      
      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          seller_id: sellerId,
          address_id: selectedAddressId,
          status: 'pending',
          payment_status: 'pending',
          payment_method_id: paymentMethodId,
          subtotal,
          tax,
          delivery_fee: deliveryFee,
          total
        })
        .select()
        .single();
        
      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      console.log("Order created successfully:", orderData);
      
      // 2. Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        meal_id: item.mealId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        subscription: item.subscription || null
      }));
      
      console.log("Creating order items:", orderItems);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
      
      console.log("Order items created successfully");
      
      // 3. Clear the cart
      if (user) {
        console.log("Clearing cart items...");
        const { error: cartError } = await supabase
          .from('cart_items')
          .delete()
          .in('id', cartItems.map(item => item.id));
          
        if (cartError) {
          console.error("Cart clearing error:", cartError);
          // Don't throw here, just log the error and continue
        }
      }

      // 4. Create notifications for both customer and seller
      console.log("Creating notifications...");
      try {
        await createOrderNotifications(orderData, user.id, sellerId, orderItems);
        console.log("Notifications created successfully");
      } catch (notifError) {
        console.error("Notification error:", notifError);
        // Don't throw here, as the order is already placed
      }
      
      // 5. Show success message
      toast({
        title: 'Order placed successfully!',
        description: 'You can track your order in order history.',
        variant: 'success'
      });
      
      // 6. Call the success callback if provided
      if (onOrderSuccess) {
        onOrderSuccess();
      }
      
      // 7. Navigate to order confirmation
      navigate(`/order-confirmation/${orderData.id}`);
      
    } catch (error: any) {
      console.error('Error placing order:', error);
      setErrorMessage(error.message || 'Failed to place order');
      toast({
        title: 'Order placement failed',
        description: error.message || 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const redirectToAddAddress = () => {
    navigate('/profile?tab=addresses&action=add');
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Order Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <MapPin className="mr-2 h-5 w-5" />
            Delivery Address
          </CardTitle>
          <CardDescription>Select where you want your order delivered</CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <RadioGroup
              value={selectedAddressId || ''}
              onValueChange={setSelectedAddressId}
              className="grid gap-4 grid-cols-1 md:grid-cols-2"
            >
              {addresses.map((address) => (
                <div key={address.id} className="relative">
                  <RadioGroupItem
                    value={address.id}
                    id={`address-${address.id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`address-${address.id}`}
                    className="flex flex-col p-4 rounded-lg border-2 border-muted bg-transparent hover:bg-muted/50 hover:border-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="font-semibold">{address.line1}</span>
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full capitalize bg-primary/10 text-primary">
                          {address.type}
                        </span>
                        {address.is_default && (
                          <span className="text-xs bg-primary/5 text-primary px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {address.line2 && `${address.line2}, `}{address.city}, {address.state} - {address.postal_code}
                    </p>
                  </Label>
                  {selectedAddressId === address.id && (
                    <Check className="absolute top-4 right-4 h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="text-center py-6">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-base text-muted-foreground mb-4">No addresses found. Please add a delivery address.</p>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={redirectToAddAddress}
              className="flex items-center gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Choose how you want to pay</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="space-y-4"
          >
            <div className="relative">
              <RadioGroupItem value="cod" id="payment-cod" className="peer sr-only" />
              <Label
                htmlFor="payment-cod"
                className="flex p-4 gap-3 rounded-lg border-2 border-muted bg-transparent hover:bg-muted/50 hover:border-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div>
                  <p className="font-semibold text-base">Cash On Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                </div>
                {paymentMethod === "cod" && (
                  <Check className="absolute top-4 right-4 h-4 w-4 text-primary" />
                )}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-3">
                  {item.mealImage && (
                    <div className="w-12 h-12 rounded overflow-hidden">
                      <img src={item.mealImage} alt={item.mealName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{item.quantity}x {item.mealName}</p>
                    <p className="text-xs text-muted-foreground">{item.sellerName}</p>
                  </div>
                </div>
                <p className="font-semibold">₹{item.subtotal.toFixed(2)}</p>
              </div>
            ))}
            
            <div className="pt-3">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4 pb-6">
          <Button
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-base py-2.5 h-auto"
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddressId || addresses.length === 0}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>Place Order</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderPlacement;
