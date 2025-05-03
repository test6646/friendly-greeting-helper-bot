
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingBag, ChefHat, Calendar, TrendingUp, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface SellerStats {
  totalMeals: number;
  activeOrders: number;
  totalEarnings: number;
  pendingDeliveries: number;
}

const SellerHomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalMeals: 0,
    activeOrders: 0,
    totalEarnings: 0,
    pendingDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [kitchenOpen, setKitchenOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get seller profile data
      const { data: sellerProfile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      setKitchenOpen(sellerProfile?.kitchen_open || false);
      
      // Get meals count
      const { count: mealsCount, error: mealError } = await supabase
        .from('meals')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id);
      
      if (mealError) throw mealError;
      
      // Get active orders
      const { count: ordersCount, error: orderError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .in('status', ['pending', 'accepted', 'preparing', 'ready']);
      
      if (orderError) throw orderError;
      
      // Get total earnings (simplified for now)
      const { data: earnings, error: earningsError } = await supabase
        .from('orders')
        .select('subtotal')
        .eq('seller_id', user.id)
        .eq('payment_status', 'completed');
      
      if (earningsError) throw earningsError;
      
      const totalEarnings = earnings?.reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0;
      
      // Get pending deliveries
      const { count: deliveriesCount, error: deliveryError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'ready');
      
      if (deliveryError) throw deliveryError;
      
      setStats({
        totalMeals: mealsCount || 0,
        activeOrders: ordersCount || 0,
        totalEarnings: totalEarnings,
        pendingDeliveries: deliveriesCount || 0
      });
      
    } catch (error) {
      console.error("Error fetching seller data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const toggleKitchenStatus = async () => {
    if (!user) return;
    
    try {
      const newStatus = !kitchenOpen;
      
      const { error } = await supabase
        .from('seller_profiles')
        .update({ kitchen_open: newStatus })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setKitchenOpen(newStatus);
      toast.success(`Kitchen ${newStatus ? 'opened' : 'closed'} successfully`);
      
    } catch (error) {
      console.error("Error toggling kitchen status:", error);
      toast.error("Failed to update kitchen status");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.first_name || 'Seller'}</h1>
            <p className="text-gray-600">Manage your kitchen and orders from your seller dashboard</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant={kitchenOpen ? "default" : "outline"}
              className={kitchenOpen ? "bg-green-600 hover:bg-green-700" : "border-gray-300"}
              onClick={toggleKitchenStatus}
            >
              {kitchenOpen ? 'Kitchen Open' : 'Kitchen Closed'}
            </Button>
            <Link to="/seller/add-meal">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Add New Meal
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4 text-primary" />
                    Total Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalMeals}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/seller/meals" className="text-sm text-primary hover:underline">
                    View all meals
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/seller/orders" className="text-sm text-primary hover:underline">
                    Manage orders
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{stats.totalEarnings.toFixed(2)}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/seller/dashboard?tab=analytics" className="text-sm text-primary hover:underline">
                    View analytics
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-primary" />
                    Pending Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.pendingDeliveries}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/seller/orders?status=ready" className="text-sm text-primary hover:underline">
                    View deliveries
                  </Link>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Manage your most recent customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.activeOrders > 0 ? (
                    <p>You have {stats.activeOrders} active orders that need your attention.</p>
                  ) : (
                    <p className="text-gray-500 italic">No active orders at the moment.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link to="/seller/dashboard?tab=orders">
                    <Button variant="outline">View All Orders</Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your kitchen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={toggleKitchenStatus}
                  >
                    <ChefHat className="mr-2 h-4 w-4" />
                    {kitchenOpen ? 'Close Kitchen' : 'Open Kitchen'}
                  </Button>
                  
                  <Link to="/seller/add-meal" className="block w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Add New Meal
                    </Button>
                  </Link>
                  
                  <Link to="/seller/dashboard" className="block w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SellerHomePage;
