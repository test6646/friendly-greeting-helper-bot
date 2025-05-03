
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from '@/hooks/use-toast';

// Update the interface to match the actual data structure from Supabase
interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  user_id: string;
  order_items: {
    meal_id: string;
    quantity: number;
    meals: any; // Using any to accommodate different possible shapes
  }[];
}

interface SellerOverviewProps {
  sellerId?: string;
  sellerProfile?: any;
}

const SellerOverview: React.FC<SellerOverviewProps> = ({ sellerId, sellerProfile }) => {
  const { isLoading, error, data: orders } = useQuery({
    queryKey: ['seller-overview-orders', sellerId || sellerProfile?.id],
    queryFn: async () => {
      try {
        // Get the seller profile ID 
        let actualSellerId = sellerId;
        
        if (!actualSellerId && sellerProfile) {
          actualSellerId = sellerProfile.id;
        }
        
        if (!actualSellerId) {
          console.error("No seller ID available for fetching orders");
          return [];
        }
        
        console.log("Fetching orders for seller ID:", actualSellerId);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            status,
            user_id,
            order_items (
              meal_id,
              quantity,
              meals (name)
            )
          `)
          .eq('seller_id', actualSellerId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching orders:', error);
          throw new Error(error.message);
        }
        
        console.log("Orders data fetched:", data);
        return data || [];
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast({
          title: "Error",
          description: "Failed to load recent orders",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!(sellerId || sellerProfile?.id)
  });

  // Improved function to safely extract meal name with better type checking
  const getMealName = (item: any): string => {
    if (!item || !item.meals) return "Unknown meal";
    
    try {
      // If meals is a string (shouldn't happen but just in case)
      if (typeof item.meals === 'string') {
        return item.meals;
      }
      
      // If meals is an array
      if (Array.isArray(item.meals)) {
        // Check if array has items and if the first item has a name property
        return item.meals.length > 0 && item.meals[0]?.name 
          ? item.meals[0].name 
          : "Unknown meal";
      }
      
      // If meals is an object
      if (typeof item.meals === 'object' && item.meals !== null) {
        // Direct access to name property
        return item.meals.name || "Unknown meal";
      }
      
      return "Unknown meal";
    } catch (e) {
      console.error("Error extracting meal name:", e);
      return "Unknown meal";
    }
  };

  if (isLoading) return <Skeleton className="w-[400px] h-[200px]" />

  if (error) return <Card>
    <CardHeader>
      <CardTitle>Error</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Failed to load orders.</p>
    </CardContent>
  </Card>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {order.order_items && order.order_items.map((item: any, index: number) => (
                        <div key={index}>{getMealName(item)}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {order.order_items && order.order_items.map((item: any, index: number) => (
                        <div key={index}>{item.quantity}</div>
                      ))}
                    </TableCell>
                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        order.status === 'completed' ? 'success' : 
                        order.status === 'pending' ? 'warning' : 
                        order.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No recent orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SellerOverview;
