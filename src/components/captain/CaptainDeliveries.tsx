import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CaptainDeliveriesProps {
  captainId: string;
}

const CaptainDeliveries: React.FC<CaptainDeliveriesProps> = ({ captainId }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!captainId) return;
    
    loadDeliveries();

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
      supabase.removeChannel(deliveriesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [captainId]);

  const loadDeliveries = async () => {
    try {
      setIsLoading(true);
      
      // Load available deliveries (orders with status = ready)
      const { data: availableData, error: availableError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          delivery_fee,
          created_at,
          address:address_id(*)
        `)
        .eq('status', 'ready');
        
      if (availableError) {
        console.error('Error fetching available deliveries:', availableError);
      } else {
        setAvailableDeliveries(availableData || []);
      }
      
      // Load captain's active deliveries
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
            address:address_id(*)
          )
        `)
        .eq('captain_id', captainId)
        .in('status', ['accepted', 'picked_up']);
        
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
            address:address_id(*)
          )
        `)
        .eq('captain_id', captainId)
        .eq('status', 'delivered');
        
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="available">Available</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="mt-4">
        {deliveries.length === 0 ? (
          <p>No active deliveries</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {deliveries.map((delivery: any) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <CardTitle>Delivery #{delivery.order.id.substring(0, 8)}</CardTitle>
                  <CardDescription>
                    Pickup Time: {new Date(delivery.pickup_time).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Status: <Badge>{delivery.status}</Badge></p>
                  <p>Delivery Fee: ₹{delivery.delivery_fee}</p>
                  <p>Address: {delivery.order.address?.line1}, {delivery.order.address?.city}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="available" className="mt-4">
        {availableDeliveries.length === 0 ? (
          <p>No deliveries available</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {availableDeliveries.map((delivery: any) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <CardTitle>Order #{delivery.id.substring(0, 8)}</CardTitle>
                  <CardDescription>
                    Created At: {new Date(delivery.created_at).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Status: <Badge>{delivery.status}</Badge></p>
                  <p>Delivery Fee: ₹{delivery.delivery_fee}</p>
                  <p>Address: {delivery.address?.line1}, {delivery.address?.city}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="completed" className="mt-4">
        {completedDeliveries.length === 0 ? (
          <p>No completed deliveries</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedDeliveries.map((delivery: any) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <CardTitle>Delivery #{delivery.order.id.substring(0, 8)}</CardTitle>
                  <CardDescription>
                    Delivery Time: {new Date(delivery.delivery_time).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Status: <Badge>{delivery.status}</Badge></p>
                  <p>Delivery Fee: ₹{delivery.delivery_fee}</p>
                  <p>Address: {delivery.order.address?.line1}, {delivery.order.address?.city}</p>
                  {delivery.captain_rating && <p>Your Rating: {delivery.captain_rating}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CaptainDeliveries;
