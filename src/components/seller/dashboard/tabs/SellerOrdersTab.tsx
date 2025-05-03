import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ShoppingBag, 
  Truck, 
  User, 
  ExternalLink,
  Phone,
  MapPin,
  Package
} from 'lucide-react';
import { notifyCaptainsForOrderPickup, createOrderStatusNotification, initializeOrderStatusListener } from '@/services/enhancedNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface OrderDelivery {
  captain_id: string;
  status: string;
  pickup_time?: string;
  delivery_time?: string;
  order_id: string;
  captain?: {
    id: string;
    name?: string;
    phone_number?: string;
    avatar_url?: string;
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  profiles: any;
  address: any;
  order_items: any[];
  delivery?: OrderDelivery; // Make delivery optional
}

interface SellerOrdersTabProps {
  sellerId?: string;
}

const SellerOrdersTab: React.FC<SellerOrdersTabProps> = ({ sellerId }) => {
  const [activeStatus, setActiveStatus] = useState<string>('pending');
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [captainDetails, setCaptainDetails] = useState<any>(null);
  const { user } = useAuth();
  
  // Initialize order status listener
  React.useEffect(() => {
    // Ensure the order status listener is set up
    initializeOrderStatusListener();
  }, []);

  // Get seller profile ID from user ID if needed
  React.useEffect(() => {
    const getSellerProfileId = async () => {
      if (!sellerId && !user?.id) return;
      
      try {
        const userId = sellerId || user?.id;
        console.log("Fetching seller profile for user ID:", userId);
        
        const { data, error } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching seller profile:", error);
        } else if (data) {
          console.log("Found seller profile ID:", data.id);
          setSellerProfileId(data.id);
        } else {
          console.error("No seller profile found for user ID:", userId);
        }
      } catch (error) {
        console.error("Error in getSellerProfileId:", error);
      }
    };
    
    getSellerProfileId();
  }, [sellerId, user?.id]);
  
  // Set up realtime listener for orders and notifications
  useEffect(() => {
    if (!sellerProfileId) return;
    
    // Subscribe to order changes
    const ordersChannel = supabase.channel(`orders-${sellerProfileId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${sellerProfileId}`
      }, (payload) => {
        console.log('Order change received for seller:', payload);
        // Refresh the orders data
        refetch();
      })
      .subscribe();
      
    console.log(`Realtime channel set up for orders with seller_id=${sellerProfileId}`);
    
    // Subscribe to notifications for this seller
    const notificationsChannel = supabase.channel(`notifications-seller`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        if (payload.new && payload.new.type === 'captain_assigned') {
          console.log("Captain assigned notification received:", payload.new);
          
          // Show toast notification
          toast.success("Captain assigned to order", {
            description: payload.new.message
          });
          
          // Refresh data
          refetch();
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [sellerProfileId]);
  
  // Fetch orders data
  const { isLoading, data: orders, refetch } = useQuery({
    queryKey: ['seller-orders', sellerProfileId, activeStatus],
    queryFn: async () => {
      if (!sellerProfileId) return [];
      
      try {
        console.log("Fetching orders for seller:", sellerProfileId, "with status:", activeStatus);
        
        // Fetch the filtered orders
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            created_at,
            status,
            total,
            user_id,
            profiles:user_id(first_name, last_name, avatar_url),
            address:address_id(*),
            order_items (
              id,
              meal_id,
              quantity,
              price,
              meals:meal_id(name, image_url)
            )
          `)
          .eq('seller_id', sellerProfileId)
          .eq('status', activeStatus)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching orders:", error);
          throw error;
        }
        
        console.log("Orders fetched:", data?.length || 0);
        if (data && data.length > 0) {
          console.log("Sample order data:", data[0]);
        } 
        
        // For out_for_delivery and completed orders, fetch delivery and captain details
        if (['out_for_delivery', 'completed'].includes(activeStatus) && data && data.length > 0) {
          // Get all order IDs
          const orderIds = data.map(order => order.id);
          const orders = data as Order[]; // Type assertion
          
          // Fetch deliveries for these orders
          const { data: deliveriesData, error: deliveriesError } = await supabase
            .from('deliveries')
            .select(`
              order_id,
              captain_id,
              status,
              pickup_time,
              delivery_time
            `)
            .in('order_id', orderIds);
            
          if (!deliveriesError && deliveriesData) {
            // Create a map of deliveries by order_id
            const deliveriesByOrderId: Record<string, OrderDelivery> = {};
            
            // Process deliveries and fetch captain details separately
            for (const delivery of deliveriesData) {
              if (delivery && delivery.order_id) {
                // Add basic delivery data first without captain details
                deliveriesByOrderId[delivery.order_id] = {
                  order_id: delivery.order_id,
                  captain_id: delivery.captain_id,
                  status: delivery.status,
                  pickup_time: delivery.pickup_time,
                  delivery_time: delivery.delivery_time,
                  captain: null
                };
                
                // Fetch captain details separately
                if (delivery.captain_id) {
                  const { data: captainData } = await supabase
                    .from('captain_profiles')
                    .select('id, vehicle_type, vehicle_registration')
                    .eq('id', delivery.captain_id)
                    .single();
                    
                  if (captainData) {
                    deliveriesByOrderId[delivery.order_id].captain = {
                      id: captainData.id,
                      name: `Captain ${captainData.id.substring(0, 4)}`,
                      avatar_url: undefined
                    };
                  }
                }
              }
            }
            
            // Add delivery data to each order
            orders.forEach(order => {
              order.delivery = deliveriesByOrderId[order.id];
            });
          }
          
          return orders;
        }
        
        return data as Order[] || [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    },
    enabled: !!sellerProfileId,
    refetchInterval: 10000 // Refresh every 10 seconds to catch new orders
  });

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      // Get the order to update
      const orderToUpdate = orders?.find(order => order.id === orderId);
      if (!orderToUpdate) {
        console.error("Order not found:", orderId);
        throw new Error("Order not found");
      }
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }
      
      // Create notification for the customer
      await createOrderStatusNotification(
        orderId, 
        orderToUpdate.user_id, 
        newStatus
      );
      
      // If order is now ready for pickup, notify captains
      if (newStatus === 'ready') {
        console.log("Order is now ready, notifying captains");
        // Pass the address object's id instead of address_id
        await notifyCaptainsForOrderPickup(orderId, orderToUpdate.address.id);
        toast.success("Captains have been notified for pickup");
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      refetch();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Get next status in the workflow
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'accepted';
      case 'accepted':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };
  
  // Get button label based on status
  const getButtonLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Accept Order';
      case 'accepted':
        return 'Start Preparing';
      case 'preparing':
        return 'Mark as Ready';
      case 'ready':
        return 'Complete Order';
      default:
        return '';
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Accepted</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Preparing</Badge>;
      case 'ready':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Ready for Pickup</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Out for Delivery</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to get formatted date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Show order details
  const showOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
    
    // If order is out for delivery, fetch captain details
    if ((order.status === 'out_for_delivery' || order.status === 'completed') && order.delivery) {
      try {
        // Check if we already have delivery data with captain details
        if (order.delivery && order.delivery.captain) {
          setCaptainDetails(order.delivery.captain);
        } else if (order.delivery && order.delivery.captain_id) {
          // Fetch captain details if we don't have them
          const { data, error } = await supabase
            .from('captain_profiles')
            .select(`
              id,
              user_id,
              vehicle_type,
              vehicle_registration
            `)
            .eq('id', order.delivery.captain_id)
            .single();
            
          if (!error && data) {
            setCaptainDetails({
              id: data.id,
              vehicle_type: data.vehicle_type,
              vehicle_registration: data.vehicle_registration
            });
          }
        }
      } catch (error) {
        console.error('Error fetching captain details:', error);
        setCaptainDetails(null);
      }
    } else {
      setCaptainDetails(null);
    }
  };

  // Render order items
  const renderOrderItems = (items: any[]) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground italic">No items</p>;
    }
    
    return (
      <ul className="space-y-2">
        {items.map((item: any) => (
          <li key={item.id} className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              {item.meals?.image_url ? (
                <img src={item.meals.image_url} alt={item.meals.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.meals?.name || `Item (${item.meal_id.substring(0, 8)})`}</p>
              <p className="text-xs text-muted-foreground">₹{item.price?.toFixed(2)} × {item.quantity}</p>
            </div>
            <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeStatus} onValueChange={setActiveStatus} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="out_for_delivery">Delivering</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {activeStatus === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
            {activeStatus === 'accepted' && <Clock className="h-4 w-4 text-blue-600" />}
            {activeStatus === 'preparing' && <ShoppingBag className="h-4 w-4 text-purple-600" />}
            {activeStatus === 'ready' && <Package className="h-4 w-4 text-orange-600" />}
            {activeStatus === 'out_for_delivery' && <Truck className="h-4 w-4 text-indigo-600" />}
            {activeStatus === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1).replace('_', ' ')} Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <ScrollArea className="h-[500px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: Order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {order.profiles?.avatar_url ? (
                              <img 
                                src={order.profiles.avatar_url} 
                                alt={`${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {order.profiles?.first_name} {order.profiles?.last_name}
                            </p>
                            {order.profiles?.email && (
                              <p className="text-xs text-muted-foreground">{order.profiles.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          {order.order_items?.slice(0, 2).map((item: any) => (
                            <li key={item.id} className="truncate max-w-[200px]">
                              {item.quantity}x {item.meals?.name || `Item (${item.meal_id.substring(0, 8)})`}
                            </li>
                          ))}
                          {order.order_items && order.order_items.length > 2 && (
                            <li className="text-muted-foreground">
                              +{order.order_items.length - 2} more items
                            </li>
                          )}
                        </ul>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => showOrderDetails(order)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" /> Details
                          </Button>
                          
                          {activeStatus !== 'completed' && activeStatus !== 'out_for_delivery' && getNextStatus(activeStatus) && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, getNextStatus(activeStatus) || '')}
                              size="sm"
                              variant="default"
                            >
                              {getButtonLabel(activeStatus)}
                            </Button>
                          )}
                          {(activeStatus === 'completed' || activeStatus === 'out_for_delivery') && (
                            getStatusBadge(order.status)
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="py-12 text-center">
              {activeStatus === 'pending' && (
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending orders</p>
                  <p className="text-sm text-muted-foreground mt-1">New customer orders will appear here</p>
                </div>
              )}
              {activeStatus === 'accepted' && (
                <div className="flex flex-col items-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No accepted orders</p>
                  <p className="text-sm text-muted-foreground mt-1">Orders you accept will appear here</p>
                </div>
              )}
              {activeStatus === 'preparing' && (
                <div className="flex flex-col items-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders in preparation</p>
                  <p className="text-sm text-muted-foreground mt-1">Orders being prepared will appear here</p>
                </div>
              )}
              {activeStatus === 'ready' && (
                <div className="flex flex-col items-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders ready for pickup</p>
                  <p className="text-sm text-muted-foreground mt-1">Orders ready for delivery will appear here</p>
                </div>
              )}
              {activeStatus === 'out_for_delivery' && (
                <div className="flex flex-col items-center">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders out for delivery</p>
                  <p className="text-sm text-muted-foreground mt-1">Orders being delivered will appear here</p>
                </div>
              )}
              {activeStatus === 'completed' && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed orders</p>
                  <p className="text-sm text-muted-foreground mt-1">Your fulfilled orders will appear here</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.id.substring(0, 8)}</DialogTitle>
                <DialogDescription>
                  <div className="flex justify-between items-center">
                    <span>{formatDate(selectedOrder.created_at)}</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-semibold text-sm mb-2">Customer</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {selectedOrder.profiles?.avatar_url ? (
                        <img 
                          src={selectedOrder.profiles.avatar_url}
                          alt={`${selectedOrder.profiles.first_name || ''} ${selectedOrder.profiles.last_name || ''}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedOrder.profiles?.first_name} {selectedOrder.profiles?.last_name}
                      </p>
                      {selectedOrder.profiles?.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {selectedOrder.profiles.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Delivery Information */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-semibold text-sm mb-2">Delivery Address</h4>
                  {selectedOrder.address ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm">{selectedOrder.address.line1}</p>
                        {selectedOrder.address.line2 && <p className="text-sm">{selectedOrder.address.line2}</p>}
                        <p className="text-sm">{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postal_code}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Address not available</p>
                  )}
                </div>
                
                {/* Captain Information (if order is out for delivery) */}
                {(selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'completed') && (
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <h4 className="font-semibold text-sm text-indigo-900 mb-2">Delivery Captain</h4>
                    {captainDetails ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                          {captainDetails.avatar_url ? (
                            <img 
                              src={captainDetails.avatar_url}
                              alt={captainDetails.name || 'Captain'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-indigo-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-indigo-900">
                            {captainDetails.name || `Captain ID: ${captainDetails.id?.substring(0, 8)}`}
                          </p>
                          <p className="text-sm text-indigo-800">
                            {captainDetails.vehicle_type || 'Vehicle'}: {captainDetails.vehicle_registration || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Captain details not available</p>
                    )}
                  </div>
                )}
                
                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Order Items</h4>
                  {renderOrderItems(selectedOrder.order_items)}
                </div>
                
                {/* Order Summary */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{(selectedOrder.total - 40).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>₹40.00</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      <span>₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {activeStatus !== 'completed' && activeStatus !== 'out_for_delivery' && getNextStatus(activeStatus) && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, getNextStatus(activeStatus) || '');
                        setIsOrderDialogOpen(false);
                      }}
                    >
                      {getButtonLabel(activeStatus)}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrdersTab;
