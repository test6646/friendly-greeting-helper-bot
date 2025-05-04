
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import CaptainProfile from './CaptainProfile';
import CaptainDeliveries from './CaptainDeliveries';
import CaptainEarnings from './CaptainEarnings';
import CaptainNewDeliveryAlert from './CaptainNewDeliveryAlert';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { initializeOrderStatusListener } from '@/services/enhancedNotificationService';
import { Skeleton } from '@/components/ui/skeleton';

const CaptainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [captainProfile, setCaptainProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deliveries');
  const { soundEnabled, toggleSound } = useNotifications();
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

  useEffect(() => {
    if (!user) return;

    const fetchCaptainProfile = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setCaptainProfile(data);
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
          <h1 className="text-2xl font-bold">Captain Dashboard</h1>
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
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 w-full mb-2"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Create Test Delivery Alert
          </Button>
        </div>
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
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="deliveries" className={isMobile ? "text-sm py-2" : ""}>Deliveries</TabsTrigger>
          <TabsTrigger value="earnings" className={isMobile ? "text-sm py-2" : ""}>Earnings</TabsTrigger>
          <TabsTrigger value="profile" className={isMobile ? "text-sm py-2" : ""}>Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deliveries" className="mt-0">
          {user?.id && <CaptainDeliveries captainId={user.id} />}
        </TabsContent>
        <TabsContent value="earnings" className="mt-0">
          {user?.id && <CaptainEarnings captainId={user.id} />}
        </TabsContent>
        <TabsContent value="profile" className="mt-0">
          {user?.id && <CaptainProfile captainId={user.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaptainDashboard;
