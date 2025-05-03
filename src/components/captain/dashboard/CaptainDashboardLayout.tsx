
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import CaptainNewDeliveryAlert from '../CaptainNewDeliveryAlert';

interface CaptainDashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  captainProfile: any;
  handleAvailabilityToggle: (value: boolean) => void;
  createTestDeliveryNotification: () => void;
  children: React.ReactNode;
}

const CaptainDashboardLayout: React.FC<CaptainDashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  captainProfile,
  handleAvailabilityToggle,
  createTestDeliveryNotification,
  children
}) => {
  const { soundEnabled, toggleSound } = useNotifications();
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Captain Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your deliveries and track your earnings
          </p>
        </div>
        
        {/* Test notification button */}
        <div className="w-full md:w-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={createTestDeliveryNotification}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 w-full mb-2"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Create Test Delivery Alert
          </Button>
        </div>
      </div>
      
      {/* Mobile optimized controls */}
      <div className="w-full flex flex-col md:flex-row gap-3">
        {/* Availability Toggle */}
        <div className={`flex items-center justify-between md:justify-start space-x-2 p-3 rounded-lg 
          ${captainProfile?.is_available 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-gray-50 border border-gray-200'}`}>
          <Switch 
            id="availability-mode" 
            checked={captainProfile?.is_available || false}
            onCheckedChange={handleAvailabilityToggle}
            className={captainProfile?.is_available ? "bg-green-600" : ""}
          />
          <Label htmlFor="availability-mode" className={`font-medium ${captainProfile?.is_available ? 'text-green-700' : 'text-gray-700'}`}>
            {captainProfile?.is_available ? 'Available for Deliveries' : 'Not Available'}
          </Label>
        </div>
        
        {/* Notification Sound Toggle */}
        <div className="flex items-center justify-between md:justify-start space-x-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6"
            onClick={toggleSound}
          >
            {soundEnabled ? (
              <Bell className="h-4 w-4 text-blue-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-600" />
            )}
          </Button>
          <Label className="font-medium text-blue-700">
            Notification Sound: {soundEnabled ? 'On' : 'Off'}
          </Label>
        </div>
      </div>
      
      {/* Display delivery alerts only if captain is available */}
      {captainProfile?.is_available && <CaptainNewDeliveryAlert />}
      
      {/* Mobile-optimized tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="deliveries" className={isMobile ? "text-sm py-2" : ""}>Deliveries</TabsTrigger>
          <TabsTrigger value="earnings" className={isMobile ? "text-sm py-2" : ""}>Earnings</TabsTrigger>
          <TabsTrigger value="profile" className={isMobile ? "text-sm py-2" : ""}>Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaptainDashboardLayout;
