
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import OrderDetails from './OrderDetails';
import { Progress } from '@/components/ui/progress';

interface CaptainOrderNotificationProps {
  notification: any;
  orderDetails: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}

const CaptainOrderNotification: React.FC<CaptainOrderNotificationProps> = ({
  notification,
  orderDetails,
  isOpen,
  setIsOpen,
  onAccept,
  onDecline,
  loading
}) => {
  const [countdown, setCountdown] = useState(120); // 120 seconds (2 minutes) countdown
  const [progress, setProgress] = useState(100); // Progress percentage
  
  useEffect(() => {
    if (isOpen && notification) {
      // Calculate initial countdown from notification created_at time
      const createdAt = new Date(notification.created_at);
      const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000); // 2 minutes
      const remainingSeconds = Math.max(0, Math.round((expiryTime.getTime() - Date.now()) / 1000));
      
      setCountdown(remainingSeconds);
      
      // Calculate initial progress
      const totalDuration = 2 * 60; // 2 minutes in seconds
      const initialProgress = Math.max(0, Math.round((remainingSeconds / totalDuration) * 100));
      setProgress(initialProgress);
      
      // Set up countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onDecline(); // Auto decline when countdown reaches zero
            return 0;
          }
          
          // Update progress bar
          const newProgress = Math.max(0, Math.round((prev - 1) / totalDuration * 100));
          setProgress(newProgress);
          
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
        setCountdown(120); // Reset countdown when dialog closes
        setProgress(100);
      };
    }
  }, [isOpen, notification, onDecline]);
  
  if (!notification) return null;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !loading) onDecline(); // Consider as decline if dialog is closed and not loading
        setIsOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl">
            <span>New Delivery Request</span>
            <Badge className={`bg-purple-100 text-purple-800 border-purple-200 ml-2 ${countdown < 30 ? 'animate-pulse' : ''}`}>
              {countdown}s
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Accept or decline this delivery request
            <div className="mt-1">
              <Progress 
                value={progress} 
                className="h-1.5" 
                indicatorClassName={progress > 50 ? "bg-purple-500" : progress > 25 ? "bg-amber-500" : "bg-red-500"} 
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <OrderDetails 
          orderDetails={orderDetails}
          loading={loading}
        />
      
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onDecline}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            onClick={onAccept}
            disabled={loading || !orderDetails}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Accept Delivery'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaptainOrderNotification;
