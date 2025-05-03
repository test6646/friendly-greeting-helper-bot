
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications as useNotificationsQuery } from '@/services/notificationService';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationItem from './NotificationItem';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, realtimeEnabled, toggleRealtime, soundEnabled, toggleSound } = useNotifications();
  const { user } = useAuth();
  const { data: notifications } = useNotificationsQuery(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Handle clicks outside of the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Get the 5 most recent notifications
  const recentNotifications = notifications?.slice(0, 5) || [];

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className={cn(
          "relative p-1.5 rounded-full transition-colors",
          isOpen ? "bg-gray-100" : "hover:bg-gray-100"
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className={cn("h-5 w-5", isMobile ? "h-4 w-4" : "h-5 w-5")} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className={cn(
            "absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-white",
            isMobile ? "min-w-[14px] h-[14px] text-[8px]" : "min-w-[16px] h-[16px] text-[10px]"
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown Content */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-1 bg-white border rounded-md shadow-lg overflow-hidden z-50",
          isMobile ? "w-[300px] max-h-[400px]" : "w-[400px] max-h-[500px]"
        )}>
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSound} 
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
              >
                {soundEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto" style={{ maxHeight: isMobile ? '300px' : '400px' }}>
            {recentNotifications.length > 0 ? (
              <div className="p-2 space-y-2">
                {recentNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    compact={true}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="p-2 border-t text-center">
            <Link 
              to="/notifications" 
              className="block w-full text-center text-sm text-blue-600 hover:underline p-2"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
