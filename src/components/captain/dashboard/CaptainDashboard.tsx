
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, MapPin, ShoppingBag, CreditCard, User, TestTube } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { initializeOrderStatusListener } from '@/services/enhancedNotificationService';
import CaptainNewDeliveryAlert from '@/components/captain/CaptainNewDeliveryAlert';
import CaptainDeliveriesTab from './tabs/CaptainDeliveriesTab';
import { Skeleton } from '@/components/ui/skeleton';

const CaptainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [captainProfile, setCaptainProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deliveries');
  const { soundEnabled, toggleSound } = useNotifications();
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeDeliveries: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    totalDeliveries: 0
  });
  const isMobile = useIsMobile();
  
  // Create fake delivery notification for testing
  const createTestDeliveryNotification = async () => {
    if (!user || !captainProfile) {
      toast.error("Captain profile not found");
      return;
    }

    try {
      console.log("Creating test delivery notification");
      
      // First create a temporary order with a valid UUID for testing purposes
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'ready')
        .limit(1)
        .single();
        
      if (orderError) {
        console.error("Error finding test order:", orderError);
        toast.error("Could not find a ready order for testing");
        return;
      }
      
      // Use an actual order ID from the database
      const testOrderId = orderData.id;
      
      // Create a test notification using a valid UUID
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: 'Test Delivery Available',
            message: 'This is a test delivery notification. You can accept or decline it.',
            type: 'delivery',
            related_entity_id: testOrderId,
            is_read: false
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      console.log("Test notification created:", data);
      
      // Try to vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
      
      toast.success("Test delivery notification created", {
        description: "You should see a delivery alert banner now"
      });
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast.error("Failed to create test notification. Check console for details.");
    }
  };
  
  // Fetch captain dashboard data
  const fetchDashboardData = async (captainId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get active deliveries
      const { data: activeDeliveries, error: activeError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('captain_id', captainId)
        .in('status', ['accepted', 'picked_up']);
        
      if (activeError) throw activeError;
      
      // Get today's deliveries and earnings
      const { data: todayDeliveries, error: todayError } = await supabase
        .from('deliveries')
        .select('delivery_fee')
        .eq('captain_id', captainId)
        .eq('status', 'delivered')
        .gte('created_at', today.toISOString());
        
      if (todayError) throw todayError;
      
      const todayEarnings = todayDeliveries.reduce((sum, item) => sum + (item.delivery_fee || 0), 0);
      
      setDashboardStats({
        activeDeliveries: activeDeliveries?.length || 0,
        todayDeliveries: todayDeliveries?.length || 0,
        todayEarnings: todayEarnings,
        totalDeliveries: captainProfile?.total_deliveries || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchCaptainProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get captain profile
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setCaptainProfile(data);
        
        // Get dashboard stats for captain
        await fetchDashboardData(data.id);
      } catch (error) {
        console.error('Error fetching captain profile:', error);
        toast.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaptainProfile();
    
    // Initialize the real-time listeners for orders and notifications
    console.log("Initializing order status listener from dashboard");
    initializeOrderStatusListener();
    
    // Subscribe to ready orders to show notifications in real-time
    const ordersChannel = supabase
      .channel('ready-orders-notify')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: "status=eq.ready" },
        (payload) => {
          console.log("Order ready for pickup notification triggered:", payload.new);
          
          // Show toast if captain is available
          if (captainProfile?.is_available) {
            console.log("Showing notification for ready order");
            
            // Try to vibrate device if supported
            if (navigator.vibrate) {
              navigator.vibrate([300, 100, 300]);
            }
            
            toast.info('New order available for pickup', {
              description: 'Check your notifications to accept this delivery',
              duration: 10000
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user, captainProfile?.is_available]);

  const handleAvailabilityToggle = async (value: boolean) => {
    if (!captainProfile || !user) return;
    
    try {
      setAvailabilityLoading(true);
      const { error } = await supabase
        .from('captain_profiles')
        .update({ is_available: value })
        .eq('id', captainProfile.id);
        
      if (error) throw error;
      
      setCaptainProfile({
        ...captainProfile,
        is_available: value
      });
      
      toast.success(value ? 'You are now available for deliveries' : 'You are now offline');
      
      // Try to vibrate device if value is true (going online)
      if (value && navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Captain Dashboard
            {captainProfile?.is_available ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">Online</Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Offline</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your deliveries and track your earnings
          </p>
        </div>
        
        {/* Test notification button */}
        <div className="w-full md:w-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={createTestDeliveryNotification}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 w-full md:w-auto"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test Delivery Alert
          </Button>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4 text-blue-500" />
              Active Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{dashboardStats.activeDeliveries}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4 text-green-500" />
              Today's Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{dashboardStats.todayDeliveries}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <CreditCard className="mr-2 h-4 w-4 text-green-500" />
              Today's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">₹{dashboardStats.todayEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-purple-500" />
              Total Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{dashboardStats.totalDeliveries}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile optimized controls */}
      <div className="w-full flex flex-col md:flex-row gap-3">
        {/* Availability Toggle */}
        <div className={`flex items-center justify-between md:justify-start space-x-2 p-3 rounded-lg 
          ${captainProfile?.is_available 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-gray-50 border border-gray-200'}`}>
          <Switch 
            id="availability-mode" 
            checked={captainProfile?.is_available || false}
            onCheckedChange={handleAvailabilityToggle}
            disabled={availabilityLoading}
            className={captainProfile?.is_available ? "bg-green-600" : ""}
          />
          <Label htmlFor="availability-mode" className={`font-medium ${captainProfile?.is_available ? 'text-green-700' : 'text-gray-700'}`}>
            {captainProfile?.is_available ? 'Available for Deliveries' : 'Not Available'}
          </Label>
        </div>
        
        {/* Notification Sound Toggle */}
        <div className="flex items-center justify-between md:justify-start space-x-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6"
            onClick={toggleSound}
          >
            {soundEnabled ? (
              <Bell className="h-4 w-4 text-blue-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-600" />
            )}
          </Button>
          <Label className="font-medium text-blue-700">
            Notification Sound: {soundEnabled ? 'On' : 'Off'}
          </Label>
        </div>
      </div>
      
      {/* Display delivery alerts only if captain is available */}
      {captainProfile?.is_available && <CaptainNewDeliveryAlert />}
      
      {/* Mobile-optimized tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="deliveries" className={isMobile ? "text-sm py-2" : ""}>
            Deliveries
          </TabsTrigger>
          <TabsTrigger value="profile" className={isMobile ? "text-sm py-2" : ""}>
            Profile
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deliveries" className="mt-0">
          {user?.id && <CaptainDeliveriesTab captainId={captainProfile.id} />}
        </TabsContent>
        
        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Captain Profile
              </CardTitle>
              <CardDescription>
                Your personal and vehicle information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {captainProfile && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p>{user?.first_name} {user?.last_name}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{user?.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                      <p className="capitalize">{captainProfile.vehicle_type}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Registration</p>
                      <p>{captainProfile.vehicle_registration}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Rating</p>
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <span className="text-amber-500 mr-1">★</span>
                          <span>{captainProfile.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={`${captainProfile.verification_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {captainProfile.verification_status === 'approved' ? 'Verified' : 'Verification Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="font-medium">Account Details</h3>
                    <p className="text-sm text-muted-foreground">
                      To update your profile or banking details, please contact support.
                    </p>
                    <Button variant="outline">
                      Edit Profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaptainDashboard;
