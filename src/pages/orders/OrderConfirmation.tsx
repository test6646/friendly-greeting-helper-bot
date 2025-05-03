
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, ArrowLeft, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderAddress {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
}

interface OrderItem {
  id: string;
  meal_id: string;
  meal_name?: string;
  meal_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  status: string;
  payment_method_id: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  address: OrderAddress;
  order_items: OrderItem[];
}

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        console.log("Fetching order details for ID:", id);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:order_items(*, meal:meal_id(*)),
            address:address_id(*)
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (!data) {
          console.log("No order found with ID:", id);
          setError("Order not found. It may have been deleted or you don't have permission to view it.");
          return;
        }
        
        console.log("Order data fetched:", data);
        
        // Transform the data to include meal names
        const transformedData = {
          ...data,
          order_items: data.order_items.map((item: any) => ({
            ...item,
            meal_name: item.meal?.name || 'Unknown Meal',
            meal_image: item.meal?.image || null
          }))
        };

        setOrder(transformedData);
        
        toast({
          title: "Order confirmed!",
          description: "Your order has been placed successfully.",
          variant: "success"
        });
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, user]);

  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleTrackOrders = () => {
    navigate('/profile?tab=orders');
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-12 px-4 md:px-0">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary mr-3" />
            <p className="text-lg">Loading your order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-12 px-4 md:px-0">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive text-center text-2xl">Order Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg">{error || "We couldn't find the order you're looking for."}</p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button onClick={handleGoHome} size="lg">
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4 md:px-0">
        <Card className="border-primary/20 bg-primary/5 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Order Placed Successfully!</CardTitle>
            <p className="text-muted-foreground mt-3 text-lg">
              Thank you for your order. We've received it and will process it shortly.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="flex justify-between mb-3">
                <p className="font-medium text-lg">Order #:</p>
                <p className="font-bold text-lg">{order.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex justify-between mb-3">
                <p className="font-medium text-lg">Date:</p>
                <p className="text-lg">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex justify-between mb-3">
                <p className="font-medium text-lg">Status:</p>
                <span className="bg-yellow-100 text-yellow-800 text-base px-3 py-1 rounded-full flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <p className="font-medium text-lg">Payment:</p>
                <p className="text-lg">Cash on Delivery</p>
              </div>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <p className="font-medium text-lg mb-3">Delivery Address:</p>
              {order.address && (
                <div className="text-base md:text-lg">
                  <p className="font-medium">{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city}, {order.address.state} - {order.address.postal_code}</p>
                </div>
              )}
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <p className="font-medium text-xl mb-4">Order Summary:</p>
              <div className="space-y-4 mb-6">
                {order.order_items && order.order_items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 border-b pb-4">
                    {item.meal_image && (
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <img src={item.meal_image} alt={item.meal_name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-lg">
                          {item.quantity}x {item.meal_name || `Meal #${item.meal_id.substring(0, 6)}`}
                        </p>
                        <p className="font-semibold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Unit price: ₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-base md:text-lg">
                  <p>Subtotal:</p>
                  <p>₹{order.subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base md:text-lg">
                  <p>Tax:</p>
                  <p>₹{order.tax.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base md:text-lg">
                  <p>Delivery Fee:</p>
                  <p>₹{order.delivery_fee.toFixed(2)}</p>
                </div>
                <div className="flex justify-between font-semibold mt-3 pt-3 border-t text-lg md:text-xl">
                  <p>Total:</p>
                  <p>₹{order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-2 pb-8">
            <Button 
              variant="outline" 
              onClick={handleGoHome}
              className="w-full sm:w-auto text-base py-6 px-6"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
            <Button 
              onClick={handleTrackOrders}
              className="w-full sm:w-auto text-base py-6 px-6 bg-primary"
              size="lg"
            >
              Track Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}

export default OrderConfirmation;
