
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Truck, Calendar, TrendingUp, MapPin } from 'lucide-react';
import { getCaptainProfileByUserId, updateCaptainAvailability, getCaptainDeliveries, getAvailableDeliveries } from '@/services/captainService';
import { CaptainProfile } from '@/models/Captain';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const CaptainHomePage = () => {
  const { user } = useAuth();
  const [captainProfile, setCaptainProfile] = useState<CaptainProfile | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({
    deliveries: 0,
    activeOrders: 0,
    earnings: 0
  });

  useEffect(() => {
    if (user) {
      fetchCaptainData();
    }
  }, [user]);

  const fetchCaptainData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get captain profile
      const profile = await getCaptainProfileByUserId(user.id);
      setCaptainProfile(profile);
      
      if (profile) {
        // Get captain's active deliveries
        const activeDeliveries = await getCaptainDeliveries(
          profile.id,
          'all'
        );
        
        setDeliveries(activeDeliveries.filter(delivery => 
          ['accepted', 'picked_up', 'out_for_delivery'].includes(delivery.status)
        ));
        
        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayDeliveries = activeDeliveries.filter(delivery => 
          new Date(delivery.createdAt) >= today && 
          new Date(delivery.createdAt) < tomorrow
        );
        
        const activeOrders = activeDeliveries.filter(delivery => 
          ['accepted', 'picked_up', 'out_for_delivery'].includes(delivery.status)
        );
        
        const todayEarnings = todayDeliveries.reduce((sum, delivery) => 
          sum + (delivery.deliveryFee || 0), 0);
        
        setTodayStats({
          deliveries: todayDeliveries.length,
          activeOrders: activeOrders.length,
          earnings: todayEarnings
        });
      }
      
    } catch (error) {
      console.error("Error fetching captain data:", error);
      toast({
        title: "Error",
        description: "Failed to load captain data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!user || !captainProfile) return;
    
    try {
      setAvailabilityLoading(true);
      const newAvailability = !captainProfile.isAvailable;
      
      // Update availability using the captain service
      const success = await updateCaptainAvailability(user.id, newAvailability);
      
      if (success) {
        setCaptainProfile({
          ...captainProfile,
          isAvailable: newAvailability
        });
        
        toast({
          title: newAvailability ? "You're now available" : "You're now offline",
          description: newAvailability 
            ? "You will now receive delivery requests" 
            : "You won't receive any new delivery requests",
        });
      } else {
        throw new Error("Failed to update availability");
      }
      
    } catch (error) {
      console.error("Error updating captain availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive"
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const renderSkeletonCard = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.first_name || 'Captain'}</h1>
            <p className="text-gray-600">Manage your deliveries and track your earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Available for deliveries:</p>
              <Switch
                checked={captainProfile?.isAvailable || false}
                onCheckedChange={toggleAvailability}
                disabled={availabilityLoading || loading}
              />
            </div>
            <Link to="/captain/dashboard">
              <Button className="bg-primary hover:bg-primary/90">
                Full Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i}>{renderSkeletonCard()}</div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Truck className="mr-2 h-4 w-4 text-primary" />
                    Active Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{todayStats.activeOrders}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/captain/deliveries" className="text-sm text-primary hover:underline">
                    View all deliveries
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    Today's Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{todayStats.deliveries}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/captain/deliveries" className="text-sm text-primary hover:underline">
                    View history
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                    Today's Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{todayStats.earnings}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/captain/earnings" className="text-sm text-primary hover:underline">
                    View earnings
                  </Link>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Current Deliveries</CardTitle>
                  <CardDescription>Manage your active delivery orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {deliveries.length > 0 ? (
                    <div className="space-y-4">
                      {deliveries.map(delivery => (
                        <div key={delivery.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{delivery.orderId?.substring(0, 8) || 'N/A'}</p>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" /> Pickup: {delivery.pickup_location || 'Restaurant location'}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" /> Deliver to: {delivery.delivery_location || 'Customer address'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              delivery.status === 'accepted' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : delivery.status === 'picked_up'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {delivery.status === 'accepted' 
                                ? 'Accepted' 
                                : delivery.status === 'picked_up'
                                ? 'Picked Up'
                                : 'In Progress'
                              }
                            </span>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Link to="/captain/deliveries">
                              <Button variant="outline" size="sm">Details</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No active deliveries at the moment.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link to="/captain/deliveries">
                    <Button variant="outline">View All Deliveries</Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>My Status</CardTitle>
                  <CardDescription>Delivery captain information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vehicle Type</p>
                    <p>{captainProfile?.vehicleType || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration</p>
                    <p>{captainProfile?.vehicleRegistration || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rating</p>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1">{captainProfile?.averageRating || '0.0'}/5.0</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/captain/profile" className="w-full">
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CaptainHomePage;
