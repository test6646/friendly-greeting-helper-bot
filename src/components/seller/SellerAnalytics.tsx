
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  ThumbsUp
} from 'lucide-react';

interface SellerAnalyticsProps {
  sellerId: string;
}

const SellerAnalytics: React.FC<SellerAnalyticsProps> = ({ sellerId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [orderData, setOrderData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topMeals, setTopMeals] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
    averageOrder: 0,
    growth: 0
  });
  
  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Determine date range
        let daysToSubtract = 7;
        if (timeRange === 'month') {
          daysToSubtract = 30;
        } else if (timeRange === 'year') {
          daysToSubtract = 365;
        } else if (timeRange === 'day') {
          daysToSubtract = 1;
        }
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToSubtract);
        
        // Fetch orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', sellerId)
          .gte('created_at', startDate.toISOString());
          
        if (ordersError) throw ordersError;
        
        // Process order data for charts
        const processedData = processOrdersForCharts(orders || []);
        setOrderData(processedData.ordersByDay);
        setRevenueData(processedData.revenueByDay);
        setOrderStats({
          total: orders?.length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0,
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
          revenue: orders?.reduce((sum, order) => sum + order.total, 0) || 0,
          averageOrder: orders?.length ? 
            (orders.reduce((sum, order) => sum + order.total, 0) / orders.length) : 0,
          growth: 10 // Placeholder for now, would need to compare with previous period
        });
        
        // Fetch top meals
        const { data: meals, error: mealsError } = await supabase
          .from('meals')
          .select(`
            id,
            name,
            price_single,
            rating,
            rating_count,
            order_items!inner (
              quantity,
              created_at
            )
          `)
          .eq('seller_id', sellerId)
          .order('rating', { ascending: false });
          
        if (mealsError) throw mealsError;
        
        // Process top meals data
        const topMealsData = (meals || []).map(meal => {
          const recentOrders = meal.order_items.filter((item: any) => 
            new Date(item.created_at) >= startDate
          );
          
          const totalSold = recentOrders.reduce((sum: number, item: any) => sum + item.quantity, 0);
          
          return {
            id: meal.id,
            name: meal.name,
            price: meal.price_single,
            rating: meal.rating,
            rating_count: meal.rating_count,
            sold: totalSold,
            revenue: totalSold * meal.price_single
          };
        }).sort((a, b) => b.sold - a.sold).slice(0, 5);
        
        setTopMeals(topMealsData);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [sellerId, timeRange, toast]);
  
  // Process orders data for charts
  const processOrdersForCharts = (orders: any[]) => {
    const ordersByDay: { [key: string]: { date: string, orders: number, revenue: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const dateKey = timeRange === 'day' 
        ? `${date.getHours()}:00`
        : date.toISOString().split('T')[0];
      
      if (!ordersByDay[dateKey]) {
        ordersByDay[dateKey] = { 
          date: dateKey, 
          orders: 0,
          revenue: 0 
        };
      }
      
      ordersByDay[dateKey].orders += 1;
      ordersByDay[dateKey].revenue += order.total;
    });
    
    const orderChartData = Object.values(ordersByDay);
    
    // Sort by date
    orderChartData.sort((a, b) => {
      if (timeRange === 'day') {
        return parseInt(a.date.split(':')[0]) - parseInt(b.date.split(':')[0]);
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Format date labels
    const formattedOrderData = orderChartData.map(item => ({
      ...item,
      date: timeRange === 'day' 
        ? item.date 
        : new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
    }));
    
    // For order count chart
    const ordersByDay2 = formattedOrderData.map(item => ({
      date: item.date,
      Orders: item.orders
    }));
    
    // For revenue chart
    const revenueByDay = formattedOrderData.map(item => ({
      date: item.date,
      Revenue: item.revenue
    }));
    
    return {
      ordersByDay: ordersByDay2,
      revenueByDay
    };
  };
  
  // Prepare data for the pie chart
  const orderStatusData = [
    { name: 'Completed', value: orderStats.completed },
    { name: 'Pending', value: orderStats.pending },
    { name: 'Cancelled', value: orderStats.cancelled }
  ].filter(item => item.value > 0);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? `₹${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last 365 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                <div className="text-2xl font-bold">{orderStats.total}</div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className={`flex items-center ${orderStats.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {orderStats.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(orderStats.growth)}%
              </div>
              <span className="text-gray-500 ml-2">vs previous {timeRange}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <div className="text-2xl font-bold">₹{orderStats.revenue.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                12%
              </div>
              <span className="text-gray-500 ml-2">vs previous {timeRange}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Order */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Average Order</p>
                <div className="text-2xl font-bold">₹{orderStats.averageOrder.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                5%
              </div>
              <span className="text-gray-500 ml-2">vs previous {timeRange}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Order Completion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completion Rate</p>
                <div className="text-2xl font-bold">
                  {orderStats.total === 0 ? '0%' : `${((orderStats.completed / orderStats.total) * 100).toFixed(0)}%`}
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <ThumbsUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                3%
              </div>
              <span className="text-gray-500 ml-2">vs previous {timeRange}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Number of orders received during the selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : orderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Orders" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <p>No order data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Revenue Over Time Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Total revenue earned during the selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <DollarSign className="h-12 w-12 text-gray-300 mb-4" />
                <p>No revenue data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by their current status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Clock className="h-12 w-12 text-gray-300 mb-4" />
                <p>No order status data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Selling Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Meals</CardTitle>
            <CardDescription>Your best performing menu items</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : topMeals.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topMeals}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [name === 'sold' ? `${value} units` : `₹${value}`, name === 'sold' ? 'Quantity Sold' : 'Revenue']}
                    labelFormatter={(name) => `Meal: ${name}`}
                  />
                  <Legend />
                  <Bar dataKey="sold" name="Quantity Sold" fill="#8884d8" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                <p>No meal sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;
