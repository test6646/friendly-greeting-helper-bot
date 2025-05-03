import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CaptainProfileProps {
  captainId: string;
}

const CaptainProfile: React.FC<CaptainProfileProps> = ({ captainId }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleRegistration: '',
  });

  useEffect(() => {
    if (!user || !captainId) return;

    const fetchCaptainProfile = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setFormData({
          vehicleType: data?.vehicle_type || '',
          vehicleRegistration: data?.vehicle_registration || '',
        });
      } catch (error) {
        console.error('Error fetching captain profile:', error);
        toast.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaptainProfile();
  }, [user, captainId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVehicleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      vehicleType: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('captain_profiles')
        .update({
          vehicle_type: formData.vehicleType,
          vehicle_registration: formData.vehicleRegistration,
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        vehicle_type: formData.vehicleType,
        vehicle_registration: formData.vehicleRegistration,
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating captain profile:', error);
      toast.error('Failed to update your profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-80" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle-type">
              <Skeleton className="h-4 w-40" />
            </Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle-registration">
              <Skeleton className="h-4 w-40" />
            </Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Captain Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle-type">Vehicle Type</Label>
          <Select onValueChange={handleVehicleTypeChange} defaultValue={profile?.vehicle_type || ''}>
            <SelectTrigger id="vehicle-type">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="bicycle">Bicycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle-registration">Vehicle Registration</Label>
          <Input
            id="vehicle-registration"
            name="vehicleRegistration"
            value={formData.vehicleRegistration}
            onChange={handleInputChange}
          />
        </div>
        <Button onClick={handleSubmit}>Update Profile</Button>
      </CardContent>
    </Card>
  );
};

export default CaptainProfile;
