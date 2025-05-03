
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, Loader2, Clock, Phone, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface OrderDetailsProps {
  orderDetails: any;
  loading: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderDetails, loading }) => {
  const isMobile = useIsMobile();
  
  // Format sizes based on device
  const textSize = isMobile ? 'text-xs' : 'text-sm';
  const headingSize = isMobile ? 'text-sm' : 'text-base';

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className={textSize}>Failed to load order details</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`font-medium ${headingSize}`}>Order Summary</h3>
        <p className={`${textSize} text-muted-foreground`}>
          Order #{orderDetails.id.substring(0, 8)}
          {orderDetails.created_at && (
            <span className="ml-2">
              - {formatDistanceToNow(new Date(orderDetails.created_at), { addSuffix: true })}
            </span>
          )}
        </p>
      </div>

      {/* Restaurant Details */}
      <div className="border rounded-md p-3 bg-gray-50">
        <h4 className={`font-medium ${textSize} mb-1`}>Restaurant</h4>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            {orderDetails.seller_profile?.cover_image_url ? (
              <img 
                src={orderDetails.seller_profile?.cover_image_url} 
                alt={orderDetails.seller_profile?.business_name || 'Restaurant'} 
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className={textSize}>
              <span className="font-medium">{orderDetails.seller_profile?.business_name || 'Restaurant'}</span>
            </p>
            {orderDetails.seller_profile?.phone_number && (
              <p className={`${textSize} text-muted-foreground flex items-center`}>
                <Phone className="h-3 w-3 mr-1" />
                {orderDetails.seller_profile.phone_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pickup Location */}
      <div className="border rounded-md p-3">
        <h4 className={`font-medium ${textSize} flex items-center mb-1`}>
          <MapPin className="h-3.5 w-3.5 mr-1 text-red-500" /> Pickup Location
        </h4>
        {orderDetails.seller_profile?.address ? (
          <p className={textSize}>
            {orderDetails.seller_profile.address}
          </p>
        ) : (
          <p className={`${textSize} text-muted-foreground`}>
            Restaurant address will be shown after accepting
          </p>
        )}
      </div>

      {/* Delivery Location */}
      <div className="border rounded-md p-3">
        <h4 className={`font-medium ${textSize} flex items-center mb-1`}>
          <MapPin className="h-3.5 w-3.5 mr-1 text-blue-500" /> Delivery Location
        </h4>
        {orderDetails.address ? (
          <div className={textSize}>
            <p>{orderDetails.address.line1}</p>
            {orderDetails.address.line2 && <p>{orderDetails.address.line2}</p>}
            <p>{orderDetails.address.city}, {orderDetails.address.state}</p>
            <p>{orderDetails.address.postal_code}</p>
          </div>
        ) : (
          <p className={`${textSize} text-muted-foreground`}>
            Address details not available
          </p>
        )}
      </div>

      {/* Timing Estimate */}
      <div className="border rounded-md p-3 bg-blue-50">
        <h4 className={`font-medium ${textSize} flex items-center mb-1 text-blue-700`}>
          <Clock className="h-3.5 w-3.5 mr-1" /> Estimated Delivery
        </h4>
        <p className={`${textSize} text-blue-800`}>
          25-30 minutes (approx. 3.2 km)
        </p>
      </div>

      {/* Payment Information */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className={textSize}>Order Total</span>
          <span className="font-medium">{orderDetails.total ? `₹${orderDetails.total.toFixed(2)}` : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={textSize}>Delivery Fee</span>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            ₹{orderDetails.delivery_fee?.toFixed(2) || '0.00'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
