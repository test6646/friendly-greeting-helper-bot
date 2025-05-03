
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/services/notificationService';
import { Notification } from '@/models/Notification';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Bell, BellOff, Users, Check, Package, AlertCircle, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { SpiceBadge } from '@/components/ui/spice-badge';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading, error } = useNotifications(user?.id);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const [filter, setFilter] = useState<Notification['type'] | 'all'>('all');
  
  const handleMarkAsRead = (notificationId: string) => {
    if (user?.id) {
      markAsRead.mutate({ notificationId, userId: user.id });
    }
  };
  
  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead.mutate(user.id);
    }
  };
  
  const handleDelete = (notificationId: string) => {
    if (user?.id) {
      deleteNotification.mutate({ notificationId, userId: user.id });
    }
  };

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5" />;
      case 'promo':
        return <Users className="h-5 w-5" />;
      case 'system':
        return <AlertCircle className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  const filteredNotifications = notifications?.filter(
    notification => filter === 'all' || notification.type === filter
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === 'order' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('order')}
            className="rounded-full"
          >
            <Package className="h-4 w-4 mr-2" />
            Orders
          </Button>
          <Button
            variant={filter === 'promo' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('promo')}
            className="rounded-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Promotions
          </Button>
          <Button
            variant={filter === 'system' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('system')}
            className="rounded-full"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            System
          </Button>
          <Button
            variant={filter === 'payment' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('payment')}
            className="rounded-full"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load notifications</p>
          </div>
        ) : filteredNotifications && filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={cn(
                  "border rounded-lg p-4 transition-all relative",
                  notification.isRead 
                    ? "bg-background" 
                    : "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center mr-3",
                    notification.isRead 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {getIconForType(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className={cn(
                        "font-semibold",
                        notification.isRead ? "text-foreground" : "text-primary"
                      )}>
                        {notification.title}
                      </h3>
                      
                      <div className="flex items-center space-x-1">
                        <SpiceBadge 
                          variant={
                            notification.type === 'order' ? "subtle-primary" : 
                            notification.type === 'promo' ? "subtle-secondary" : 
                            notification.type === 'system' ? "outline-destructive" :
                            "outline"
                          } 
                          size="sm"
                        >
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </SpiceBadge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    
                    {notification.relatedEntityId && notification.type === 'order' && (
                      <Link 
                        to={`/orders/${notification.relatedEntityId}`}
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View order details
                      </Link>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsRead.isPending}
                          >
                            {markAsRead.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark as read"}
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteNotification.isPending}
                        >
                          {deleteNotification.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-muted-foreground">
              {filter !== 'all' 
                ? `You don't have any ${filter} notifications at the moment.` 
                : "You're all caught up!"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
