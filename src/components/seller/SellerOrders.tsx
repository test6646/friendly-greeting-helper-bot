import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Order, OrderItem } from '@/services/mealService';
import { DeliveryProfile } from '@/interfaces/supabase';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Truck, PackageCheck, XCircle, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input as InputUI } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface SellerOrdersProps {
  sellerId?: string;
}

interface OrderWithDeliveries extends Order {
  deliveries: DeliveryProfile[] | DeliveryProfile;
}

const SellerOrders: React.FC<SellerOrdersProps> = ({ sellerId }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithDeliveries[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDeliveries[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDeliveries | null>(null);
  const [deliveryProfiles, setDeliveryProfiles] = useState<DeliveryProfile[]>([]);
  const [selectedDeliveryProfile, setSelectedDeliveryProfile] = useState<DeliveryProfile | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              meal:meal_id(name, price_single, images)
            ),
            address:address_id(*),
            deliveries(*)
          `)
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "Error",
            description: "Failed to load orders",
            variant: "destructive"
          });
          return;
        }

        setOrders(data as OrderWithDeliveries[]);
        setFilteredOrders(data as OrderWithDeliveries[]);
      } catch (error) {
        console.error('Error in fetchOrders:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchOrders();
    }
  }, [sellerId, toast]);

  useEffect(() => {
    let results = [...orders];

    if (date?.from && date?.to) {
      results = results.filter(order => {
        const orderDate = new Date(order.created_at);
        const fromDate = new Date(date.from as Date);
        const toDate = new Date(date.to as Date);
        toDate.setDate(toDate.getDate() + 1); // Include the end date

        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(order => {
        const customerName = `${order.address.line1} ${order.address.line2} ${order.address.city} ${order.address.state} ${order.address.postal_code}`.toLowerCase();
        return customerName.includes(query);
      });
    }

    setFilteredOrders(results);
  }, [date, searchQuery, orders]);

  const handleViewDetails = (order: OrderWithDeliveries) => {
    setSelectedOrder(order);
    setDeliveryStatus(order.status);
    
    // Handle deliveries safely - normalize to array
    let deliveryArray: DeliveryProfile[] = [];
    
    if (order.deliveries) {
      if (Array.isArray(order.deliveries)) {
        deliveryArray = order.deliveries;
      } else {
        // Single delivery object
        deliveryArray = [order.deliveries];
      }
    }
    
    setDeliveryProfiles(deliveryArray);
    
    if (deliveryArray.length > 0) {
      const deliveryProfile = deliveryArray[0];
      setSelectedDeliveryProfile(deliveryProfile);
      setDeliveryNotes(deliveryProfile.delivery_notes || '');
    } else {
      setSelectedDeliveryProfile(null);
      setDeliveryNotes('');
    }
    
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedOrder(null);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'enroute':
        return <Truck className="h-4 w-4 mr-2 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      case 'picked-up':
        return <PackageCheck className="h-4 w-4 mr-2 text-purple-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  const handleDeliveryStatusChange = (value: string) => {
    setDeliveryStatus(value);
  };

  const handleDeliveryNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeliveryNotes(e.target.value);
  };

  const handleSaveDelivery = async () => {
    if (!selectedOrder) return;

    try {
      setSaving(true);

      // Update the order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: deliveryStatus })
        .eq('id', selectedOrder.id);

      if (orderError) {
        throw orderError;
      }

      // Update the delivery profile
      if (selectedDeliveryProfile) {
        const { error: deliveryError } = await supabase
          .from('deliveries')
          .update({ status: deliveryStatus, delivery_notes: deliveryNotes })
          .eq('order_id', selectedOrder.id);

        if (deliveryError) {
          throw deliveryError;
        }
      }

      // Refresh orders
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            meal:meal_id(name, price_single, images)
          ),
          address:address_id(*),
          deliveries(*)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data as OrderWithDeliveries[]);
      setFilteredOrders(data as OrderWithDeliveries[]);

      toast({
        title: "Delivery updated",
        description: "Delivery status updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating delivery:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage and view your orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="max-w-md">
              <Input
                placeholder="Search by customer name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  pagedNavigation
                  className="border-0 rounded-md overflow-hidden pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    {order.address.line1}, {order.address.city}
                  </TableCell>
                  <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>₹{order.total}</TableCell>
                  <TableCell>{renderStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleViewDetails(order)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about this order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Items */}
              <div className="md:col-span-1">
                <h4 className="text-lg font-semibold mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item: OrderItem) => (
                    <Card key={item.id}>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {item.meal?.images && item.meal.images.length > 0 ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.meal.images[0]} alt={item.meal.name} />
                              <AvatarFallback>M</AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>M</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="font-medium">{item.meal?.name}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div>₹{item.subtotal}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Order Summary and Delivery */}
              <div className="md:col-span-1">
                <h4 className="text-lg font-semibold mb-4">Order Summary</h4>
                <Card className="mb-4">
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{selectedOrder.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{selectedOrder.delivery_fee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>
                  </CardContent>
                </Card>

                <h4 className="text-lg font-semibold mb-4">Delivery Details</h4>
                <Card className="mb-4">
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Delivery Address</Label>
                      <p>{selectedOrder.address.line1}</p>
                      <p>{selectedOrder.address.line2}</p>
                      <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postal_code}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label>Delivery Status</Label>
                      <div className="flex items-center">
                        {renderDeliveryStatusIcon(selectedOrder.status)}
                        <span>{selectedOrder.status}</span>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label>Update Delivery Status</Label>
                      <Select onValueChange={handleDeliveryStatusChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="enroute">Enroute</SelectItem>
                          <SelectItem value="picked-up">Picked Up</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div>
                      <Label>Delivery Notes</Label>
                      <Textarea
                        placeholder="Add delivery notes..."
                        value={deliveryNotes}
                        onChange={handleDeliveryNotesChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleCloseViewModal}>
              Close
            </Button>
            <Button onClick={handleSaveDelivery} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
