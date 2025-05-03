
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface CaptainEarningsTabProps {
  captainId: string;
}

const CaptainEarningsTab: React.FC<CaptainEarningsTabProps> = ({ captainId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>({
    total: 0,
    today: 0,
    weekly: 0,
    monthly: 0,
    chartData: []
  });

  useEffect(() => {
    if (!captainId) return;

    const fetchEarnings = async () => {
      try {
        setIsLoading(true);

        // Fetch total earnings
        const { data: totalData, error: totalError } = await supabase
          .from('deliveries')
          .select('delivery_fee, created_at')
          .eq('captain_id', captainId)
          .eq('status', 'delivered');

        if (totalError) throw totalError;

        const total = totalData?.reduce((acc, curr) => acc + (curr.delivery_fee || 0), 0) || 0;

        // Fetch today's earnings
        const today = totalData?.filter(delivery => {
          if (!delivery.created_at) return false;
          const deliveryDate = new Date(delivery.created_at);
          const todayDate = new Date();
          return deliveryDate.toDateString() === todayDate.toDateString();
        }).reduce((acc, curr) => acc + (curr.delivery_fee || 0), 0) || 0;

        // Fetch weekly earnings
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const { data: weeklyData, error: weeklyError } = await supabase
          .from('deliveries')
          .select('delivery_fee, created_at')
          .eq('captain_id', captainId)
          .gte('created_at', lastWeek.toISOString())
          .eq('status', 'delivered');

        if (weeklyError) throw weeklyError;

        const weekly = weeklyData?.reduce((acc, curr) => acc + (curr.delivery_fee || 0), 0) || 0;

        // Fetch monthly earnings
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const { data: monthlyData, error: monthlyError } = await supabase
          .from('deliveries')
          .select('delivery_fee, created_at')
          .eq('captain_id', captainId)
          .gte('created_at', firstDayOfMonth.toISOString())
          .eq('status', 'delivered');

        if (monthlyError) throw monthlyError;

        const monthly = monthlyData?.reduce((acc, curr) => acc + (curr.delivery_fee || 0), 0) || 0;

        // Generate chart data (last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];

          const dailyEarnings = weeklyData?.filter(delivery => {
            if (!delivery.created_at) return false;
            const deliveryDate = new Date(delivery.created_at);
            return deliveryDate.toISOString().split('T')[0] === dateString;
          }).reduce((acc, curr) => acc + (curr.delivery_fee || 0), 0) || 0;

          chartData.push({
            date: dateString,
            earnings: dailyEarnings
          });
        }

        setEarnings({
          total,
          today,
          weekly,
          monthly,
          chartData
        });

      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, [captainId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>All time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-2xl font-bold">₹{earnings.total.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Earnings</CardTitle>
            <CardDescription>Earnings for today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-2xl font-bold">₹{earnings.today.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Earnings</CardTitle>
            <CardDescription>Earnings for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-2xl font-bold">₹{earnings.weekly.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>Earnings for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-2xl font-bold">₹{earnings.monthly.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Chart (Last 7 Days)</CardTitle>
          <CardDescription>A visual representation of your earnings over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earnings.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                    return isNaN(numValue) ? value : `₹${numValue.toFixed(2)}`;
                  }}
                />
                <Bar dataKey="earnings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CaptainEarningsTab;
