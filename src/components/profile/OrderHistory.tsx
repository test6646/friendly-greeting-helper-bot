
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userId }) => {
  // In a real app, we would fetch order data from the database
  // For now, we'll use placeholder data
  const orders = [
    {
      id: 'ORD-001',
      date: '2025-04-25',
      status: 'Delivered',
      total: 450.00,
      items: [
        { name: 'Homemade Paneer Butter Masala (1 serving)', price: 180.00 },
        { name: 'Homestyle Dal Tadka (2 servings)', price: 240.00 },
        { name: 'Jeera Rice (1 serving)', price: 60.00 }
      ],
      seller: 'Anita\'s Kitchen'
    },
    {
      id: 'ORD-002',
      date: '2025-04-20',
      status: 'Delivered',
      total: 350.00,
      items: [
        { name: 'South Indian Thali (1 serving)', price: 150.00 },
        { name: 'Malabar Parota (4 pieces)', price: 120.00 },
        { name: 'Rasmalai (2 pieces)', price: 80.00 }
      ],
      seller: 'Lakshmi\'s Delights'
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="border-gray-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Order Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Order #{order.id}</h3>
                      <div className="text-sm text-gray-500">
                        {new Date(order.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="p-4">
                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Seller:</span> {order.seller}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button variant="outline" size="sm" className="text-xs border-gray-300">
                      Need Help?
                    </Button>
                    <Button 
                      variant="link" 
                      size="sm"
                      className="text-primary flex items-center text-xs"
                    >
                      View Details
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-center">
            <Button variant="outline" className="border-gray-300">
              View More Orders
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Once you place an order, it will appear here.</p>
          <div className="mt-6">
            <Button className="bg-primary hover:bg-primary/90">
              Browse Meals
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
