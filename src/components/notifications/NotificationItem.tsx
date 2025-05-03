
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Package, CreditCard, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Notification } from '@/models/Notification';
import { useIsMobile } from '@/hooks/use-mobile';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  compact = false
}) => {
  const isMobile = useIsMobile();
  const textSize = isMobile ? "text-xs" : "text-sm";
  const iconSize = isMobile ? 14 : 16;
  
  // Get appropriate icon based on notification type
  const getIcon = () => {
    switch(notification.type) {
      case 'order':
        return <Package size={iconSize} className="text-blue-500" />;
      case 'payment':
        return <CreditCard size={iconSize} className="text-green-500" />;
      case 'promo':
        return <Bell size={iconSize} className="text-purple-500" />;
      default:
        return <Info size={iconSize} className="text-gray-500" />;
    }
  };

  // Format the notification time relative to now (e.g., "5 minutes ago")
  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div 
      className={cn(
        "border rounded-md p-3 transition-all flex gap-3",
        notification.isRead ? "bg-background" : "bg-blue-50",
        compact && "p-2"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("font-medium line-clamp-1", textSize)}>
            {notification.title}
          </h4>
          <span className={cn("text-muted-foreground whitespace-nowrap", isMobile ? "text-[10px]" : "text-xs")}>
            {formattedTime}
          </span>
        </div>
        <p className={cn("text-muted-foreground mt-1 line-clamp-2", isMobile ? "text-xs" : "text-sm")}>
          {notification.message}
        </p>
        
        {!compact && (
          <div className="flex justify-end gap-2 mt-2">
            {!notification.isRead && onRead && (
              <button 
                onClick={() => onRead(notification.id)}
                className={cn("text-blue-600 hover:text-blue-800", isMobile ? "text-xs" : "text-sm")}
              >
                Mark as read
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(notification.id)}
                className={cn("text-red-600 hover:text-red-800", isMobile ? "text-xs" : "text-sm")}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
