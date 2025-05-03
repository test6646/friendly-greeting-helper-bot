
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CaptainDeliveryAlertBannerProps {
  notificationCount: number;
  onViewDelivery: () => void;
}

const CaptainDeliveryAlertBanner: React.FC<CaptainDeliveryAlertBannerProps> = ({ 
  notificationCount, 
  onViewDelivery 
}) => {
  if (notificationCount <= 0) return null;
  
  return (
    <Alert className="bg-primary/5 border-primary/20 mb-6 animate-pulse">
      <Bell className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary font-medium flex items-center">
        New delivery {notificationCount > 1 && `(${notificationCount})`} available!
      </AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span className="text-primary/90">
          You have {notificationCount} new {notificationCount === 1 ? 'order' : 'orders'} available for delivery
        </span>
        <Button 
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={onViewDelivery}
        >
          View Delivery
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default CaptainDeliveryAlertBanner;
