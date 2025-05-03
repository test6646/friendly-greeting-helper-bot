
import React from 'react';
import { 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import OrderDetails from './OrderDetails';
import OrderActionButtons from './OrderActionButtons';

interface OrderNotificationContentProps {
  notification: any;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
  orderDetails: any;
}

const OrderNotificationContent: React.FC<OrderNotificationContentProps> = ({
  notification,
  onAccept,
  onDecline,
  loading,
  orderDetails
}) => {
  const isMobile = useIsMobile();
  
  // Format sizes based on device
  const textSize = isMobile ? 'text-xs' : 'text-sm';
  const headingSize = isMobile ? 'text-sm' : 'text-base';
  
  return (
    <>
      <DialogHeader>
        <DialogTitle className={headingSize}>
          New Delivery Request
        </DialogTitle>
        <DialogDescription id="notification-description" className={textSize}>
          You have a new order available for delivery
        </DialogDescription>
      </DialogHeader>

      <OrderDetails 
        orderDetails={orderDetails}
        loading={loading}
      />

      <DialogFooter className="gap-2 mt-4">
        <OrderActionButtons
          onAccept={onAccept}
          onDecline={onDecline}
          loading={loading}
          hasOrderDetails={!!orderDetails}
        />
      </DialogFooter>
    </>
  );
};

export default OrderNotificationContent;
