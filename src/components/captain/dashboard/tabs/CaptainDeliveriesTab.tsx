import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, MapPin, ChevronRight, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fetchOrderDetails, acceptDeliveryOrder, declineDeliveryOrder } from '@/utils/captainOrderUtils';
import CaptainOrderNotification from '@/components/captain/CaptainOrderNotification';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import DeliveryStatusControls from '@/components/captain/DeliveryStatusControls';

interface CaptainDeliveriesTabProps {
  captainId: string;
}

const ORDER_AVAILABILITY_MINUTES = 3;

const CaptainDeliveriesTab: React.FC<CaptainDeliveriesTabProps> = ({ captainId }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  
  // Order dialog states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    if (!captainId) return;
    
    loadDeliveries();

    // Set up interval to refresh available deliveries every 15 seconds
    const refreshInterval = setInterval(() => {
      loadDeliveries();
    }, 15000);

    // Subscribe to real-time updates for deliveries
    const deliveriesChannel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries' },
        (payload) => {
          if (payload.new.captain_id === captainId) {
            loadDeliveries();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries' },
        (payload) => {
          if (payload.new.captain_id === captainId) {
            loadDeliveries();
          }
        }
      )
      .subscribe();

    // Subscribe to ready orders for available deliveries
    const ordersChannel = supabase
      .channel('ready-orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: "status=eq.ready" },
        () => {
          loadDeliveries();
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(deliveriesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [captainId]);

  const loadDeliveries = async () => {
    try {
      setIsLoading(true);
      
      // Load available deliveries (orders with status = ready, within the past 3 minutes)
      const threeMinutesAgo = new Date();
      threeMinutesAgo.setMinutes(threeMinutesAgo.getMinutes() - ORDER_AVAILABILITY_MINUTES);
      
      const { data: availableData, error: availableError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          delivery_fee,
          created_at,
          ready_at,
          seller_id,
          seller_profile:seller_id(business_name, cover_image_url),
          address:address_id(*)
        `)
        .eq('status', 'ready')
        .gt('ready_at', threeMinutesAgo.toISOString());
        
      if (availableError) {
        console.error('Error fetching available deliveries:', availableError);
      } else {
        console.log('Available deliveries fetched:', availableData);
        setAvailableDeliveries(availableData || []);
      }
      
      // Load captain's active deliveries - Update query to include seller_id
      const { data: activeData, error: activeError } = await supabase
        .from('deliveries')
        .select(`
          id,
          status,
          delivery_fee,
          created_at,
          pickup_time,
          delivery_time,
          order:order_id(
            id, 
            status, 
            total,
            seller_id,
            seller_profile:seller_id(business_name, cover_image_url),
            address:address_id(*)
          )
        `)
        .eq('captain_id', captainId)
        .in('status', ['accepted', 'picked_up', 'out_for_delivery']);
        
      if (activeError) {
        console.error('Error fetching captain deliveries:', activeError);
      } else {
        setDeliveries(activeData || []);
      }
      
      // Load captain's completed deliveries
      const { data: completedData, error: completedError } = await supabase
        .from('deliveries')
        .select(`
          id,
          status,
          delivery_fee,
          created_at,
          pickup_time,
          delivery_time,
          captain_rating,
          order:order_id(
            id, 
            status, 
            total,
            seller_id,
            seller_profile:seller_id(business_name, cover_image_url),
            address:address_id(*)
          )
        `)
        .eq('captain_id', captainId)
        .eq('status', 'delivered')
        .order('delivery_time', { ascending: false })
        .limit(10);
        
      if (completedError) {
        console.error('Error fetching captain deliveries:', completedError);
      } else {
        setCompletedDeliveries(completedData || []);
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewDelivery = async (order: any) => {
    setSelectedOrder({
      id: crypto.randomUUID(),
      title: "Delivery Request",
      message: "New delivery request available",
      type: "delivery",
      related_entity_id: order.id,
      is_read: false
    });
    
    setDialogLoading(true);
    setIsOrderDialogOpen(true);
    
    // Fetch complete order details
    const details = await fetchOrderDetails(order.id);
    setOrderDetails(details);
    setDialogLoading(false);
  };
  
  const handleAcceptOrder = async () => {
    if (!selectedOrder || !orderDetails || !captainId) {
      toast.error("Unable to accept delivery");
      return;
    }
    
    setDialogLoading(true);
    
    const success = await acceptDeliveryOrder(selectedOrder, orderDetails, captainId);
    
    if (success) {
      toast.success("Delivery accepted");
      setIsOrderDialogOpen(false);
      setSelectedOrder(null);
      setOrderDetails(null);
      
      // Reload deliveries to show the new active delivery
      loadDeliveries();
      
      // Switch to active tab
      setActiveTab('active');
    }
    
    setDialogLoading(false);
  };
  
  const handleDeclineOrder = async () => {
    if (!selectedOrder) {
      setIsOrderDialogOpen(false);
      return;
    }
    
    setDialogLoading(true);
    
    const success = await declineDeliveryOrder(selectedOrder);
    
    if (success) {
      toast.info("Delivery declined");
      setIsOrderDialogOpen(false);
      setSelectedOrder(null);
      setOrderDetails(null);
    }
    
    setDialogLoading(false);
  };
  
  // Calculate time remaining for ready orders
  const calculateTimeRemaining = (readyAt: string) => {
    if (!readyAt) return { minutes: 0, seconds: 0, percentage: 0 };
    
    const readyTime = new Date(readyAt);
    const expiryTime = new Date(readyTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + ORDER_AVAILABILITY_MINUTES);
    
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    
    // If already expired
    if (diffMs <= 0) return { minutes: 0, seconds: 0, percentage: 0 };
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    // Calculate percentage of time remaining
    const totalMs = ORDER_AVAILABILITY_MINUTES * 60 * 1000;
    const percentage = Math.round((diffMs / totalMs) * 100);
    
    return { minutes, seconds, percentage };
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Accepted</Badge>;
      case 'picked_up':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Picked Up</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full rounded-md" />
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end">
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="available" className="relative">
            Available
            {availableDeliveries.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {availableDeliveries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="relative">
            Active
            {deliveries.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {deliveries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="mt-0 space-y-4">
          {availableDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-gray-50 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No available deliveries</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                Orders ready for delivery will appear here. They will be available for 3 minutes after being marked ready.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {availableDeliveries.map((delivery: any) => {
                const timeRemaining = calculateTimeRemaining(delivery.ready_at);
                
                return (
                  <Card key={delivery.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-medium">
                            {delivery.seller_profile?.business_name || "Restaurant"}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Order #{delivery.id.substring(0, 8)}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Ready for pickup
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" /> 
                          <span className="truncate">
                            {delivery.address?.line1}, {delivery.address?.city}
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded-md space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Time remaining:</span>
                            <span className="font-medium text-amber-600">
                              {timeRemaining.minutes}m {timeRemaining.seconds}s
                            </span>
                          </div>
                          <Progress 
                            value={timeRemaining.percentage} 
                            className="h-1.5"
                            indicatorClassName={timeRemaining.percentage > 50 
                              ? "bg-green-500" 
                              : timeRemaining.percentage > 20 
                              ? "bg-amber-500" 
                              : "bg-red-500"} 
                          />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Delivery Fee</span>
                            <span className="font-medium text-green-600">₹{delivery.delivery_fee}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs text-gray-500">Order Total</span>
                            <span className="font-medium">₹{delivery.total}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="px-4 py-3 bg-gray-50 border-t flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDelivery(delivery)}
                      >
                        View Details
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => handleViewDelivery(delivery)}
                      >
                        Accept
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-0 space-y-4">
          {deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-gray-50 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No active deliveries</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                Accepted deliveries will appear here. Check the Available tab for new delivery requests.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {deliveries.map((delivery: any) => (
                <Card key={delivery.id} className={`border-l-4 ${
                  delivery.status === 'accepted' ? 'border-l-blue-500' : 
                  delivery.status === 'picked_up' ? 'border-l-amber-500' : 
                  'border-l-purple-500'
                } overflow-hidden`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">
                          {delivery.order.seller_profile?.business_name || "Restaurant"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Order #{delivery.order.id.substring(0, 8)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(delivery.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm space-x-3 text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          <span>
                            {format(new Date(delivery.pickup_time || delivery.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          <span className="truncate max-w-[150px]">
                            {delivery.order.address?.city}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-md flex flex-col space-y-1">
                        <p className="text-xs text-blue-700 font-medium">DELIVERY ADDRESS</p>
                        <p className="text-sm text-blue-800">
                          {delivery.order.address?.line1}
                          {delivery.order.address?.line2 && `, ${delivery.order.address.line2}`}
                        </p>
                        <p className="text-sm text-blue-800">
                          {delivery.order.address?.city}, {delivery.order.address?.state} {delivery.order.address?.postal_code}
                        </p>
                      </div>
                      
                      <div className="border-t pt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Earning</span>
                            <span className="font-medium text-green-600">₹{delivery.delivery_fee}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Navigate
                          </Button>
                        </div>
                        
                        {/* Add delivery status controls */}
                        <DeliveryStatusControls
                          deliveryId={delivery.id}
                          orderId={delivery.order.id}
                          sellerId={delivery.order.seller_id}
                          currentStatus={delivery.status}
                          onStatusChange={loadDeliveries}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0 space-y-4">
          {completedDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-gray-50 text-center">
              <XCircle className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No completed deliveries</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                Your delivery history will appear here once you've completed some deliveries.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {completedDeliveries.map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">
                          {delivery.order.seller_profile?.business_name || "Restaurant"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Completed {formatDistanceToNow(new Date(delivery.delivery_time), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Delivered
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" /> 
                        <span className="truncate">
                          {delivery.order.address?.line1}, {delivery.order.address?.city}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Earned</span>
                          <span className="font-medium text-green-600">₹{delivery.delivery_fee}</span>
                        </div>
                        {delivery.captain_rating && (
                          <div className="flex items-center bg-amber-50 text-amber-800 px-2 py-1 rounded">
                            <span className="text-amber-500 mr-1">★</span>
                            <span className="font-medium">{delivery.captain_rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Order notification dialog */}
      <CaptainOrderNotification
        notification={selectedOrder}
        onAccept={handleAcceptOrder}
        onDecline={handleDeclineOrder}
        isOpen={isOrderDialogOpen}
        setIsOpen={setIsOrderDialogOpen}
        orderDetails={orderDetails}
        loading={dialogLoading}
      />
    </>
  );
};

export default CaptainDeliveriesTab;
