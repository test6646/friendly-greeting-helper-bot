
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderActionButtonsProps {
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
  hasOrderDetails: boolean;
}

const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  onAccept,
  onDecline,
  loading,
  hasOrderDetails
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex gap-2 w-full">
      <Button
        variant="destructive"
        size={isMobile ? "sm" : "default"}
        onClick={onDecline}
        disabled={loading}
        className="flex-1"
      >
        <X className="h-4 w-4 mr-2" /> Decline
      </Button>
      <Button 
        variant="default"
        size={isMobile ? "sm" : "default"}
        onClick={onAccept}
        disabled={loading || !hasOrderDetails}
        className="flex-1 bg-primary hover:bg-primary/90"
      >
        <Check className="h-4 w-4 mr-2" /> Accept Delivery
      </Button>
    </div>
  );
};

export default OrderActionButtons;
