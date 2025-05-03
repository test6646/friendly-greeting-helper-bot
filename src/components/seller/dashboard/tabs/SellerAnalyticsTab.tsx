
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SellerAnalyticsTabProps {
  sellerId?: string;
}

const SellerAnalyticsTab: React.FC<SellerAnalyticsTabProps> = ({ sellerId }) => {
  const { isLoading, error, data: orders } = useQuery({
    queryKey: ['seller-analytics', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            created_at,
            total,
            status,
            order_items (
              meal_id,
              quantity,
              price,
              meals:meal_id(name, category)
            )
          `)
          .eq('seller_id', sellerId);
          
        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error fetching order data:', error);
        return [];
      }
    },
    enabled: !!sellerId
  });

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!orders) return null;
    
    // Total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Current month revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).reduce((sum, order) => sum + order.total, 0);
    
    // Weekly revenue data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dailyRevenue = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date && orderDate < nextDate;
      }).reduce((sum, order) => sum + order.total, 0);
      
      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dailyRevenue
      });
    }
    
    // Category distribution for pie chart
    const categoryMap = new Map();
    let totalItems = 0;
    
    orders.forEach(order => {
      order.order_items.forEach((item: any) => {
        const category = item.meals?.category || 'Uncategorized';
        const currentCount = categoryMap.get(category) || 0;
        categoryMap.set(category, currentCount + item.quantity);
        totalItems += item.quantity;
      });
    });
    
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: totalItems ? Math.round((value as number / totalItems) * 100) : 0
    }));
    
    // Top selling items
    const itemsMap = new Map();
    orders.forEach(order => {
      order.order_items.forEach((item: any) => {
        const itemName = item.meals?.name || 'Unknown Item';
        const currentCount = itemsMap.get(itemName) || 0;
        itemsMap.set(itemName, currentCount + item.quantity);
      });
    });
    
    const topSellingItems = Array.from(itemsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);
    
    return {
      totalRevenue,
      monthlyRevenue,
      weeklyData,
      categoryData,
      topSellingItems,
      totalOrders: orders.length,
      completedOrders: orders.filter(order => order.status === 'completed').length
    };
  }, [orders]);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );

  if (error || !analytics) return (
    <Card>
      <CardHeader>
        <CardTitle>Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Failed to load analytics data</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{analytics.completedOrders} completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue</CardTitle>
          <CardDescription>Last 7 days revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Sales by meal category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.categoryData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} orders`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Most popular meals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.topSellingItems}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalyticsTab;
