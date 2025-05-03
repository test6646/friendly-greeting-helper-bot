
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Package, MapPin, CheckCircle } from 'lucide-react';
import { 
  updateDeliveryToPickedUp, 
  updateDeliveryToOutForDelivery, 
  updateDeliveryToDelivered 
} from '@/utils/captain/deliveryOrderUtils';

interface DeliveryStatusControlsProps {
  deliveryId: string;
  orderId: string;
  sellerId: string;
  currentStatus: string;
  onStatusChange: () => void;
}

const DeliveryStatusControls: React.FC<DeliveryStatusControlsProps> = ({ 
  deliveryId, 
  orderId,
  sellerId,
  currentStatus,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleStatusUpdate = async (newStatus: 'picked_up' | 'out_for_delivery' | 'delivered') => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      let success = false;
      
      switch(newStatus) {
        case 'picked_up':
          success = await updateDeliveryToPickedUp(deliveryId, orderId, sellerId);
          if (success) toast.success("Order marked as picked up");
          break;
        case 'out_for_delivery':
          success = await updateDeliveryToOutForDelivery(deliveryId, orderId, sellerId);
          if (success) toast.success("Order marked as out for delivery");
          break;
        case 'delivered':
          success = await updateDeliveryToDelivered(deliveryId, orderId, sellerId);
          if (success) toast.success("Order marked as delivered");
          break;
      }
      
      if (success) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      toast.error("Failed to update delivery status");
    } finally {
      setLoading(false);
    }
  };
  
  // Show appropriate buttons based on current status
  const renderStatusButtons = () => {
    if (loading) {
      return (
        <Button disabled className="w-full">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating status...
        </Button>
      );
    }
    
    switch (currentStatus) {
      case 'accepted':
        return (
          <Button
            onClick={() => handleStatusUpdate('picked_up')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Mark as Picked Up
          </Button>
        );
      case 'picked_up':
        return (
          <Button
            onClick={() => handleStatusUpdate('out_for_delivery')}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Start Delivery
          </Button>
        );
      case 'out_for_delivery':
        return (
          <Button
            onClick={() => handleStatusUpdate('delivered')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        );
      case 'delivered':
        return (
          <Button disabled className="w-full bg-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            Delivered
          </Button>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full">
      {renderStatusButtons()}
    </div>
  );
};

export default DeliveryStatusControls;
