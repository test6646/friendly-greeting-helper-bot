
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  relatedEntityId?: string;
  createdAt: string;
}

export type NotificationType = 'order' | 'payment' | 'system' | 'promo' | 'delivery';

// Helper functions to work with notifications

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'order':
      return 'package';
    case 'payment':
      return 'credit-card';
    case 'system':
      return 'bell';
    case 'promo':
      return 'gift';
    case 'delivery':
      return 'truck';
    default:
      return 'bell';
  }
};

export const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'order':
      return 'bg-green-100 text-green-600';
    case 'payment':
      return 'bg-blue-100 text-blue-600';
    case 'system':
      return 'bg-purple-100 text-purple-600';
    case 'promo':
      return 'bg-amber-100 text-amber-600';
    case 'delivery':
      return 'bg-indigo-100 text-indigo-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};
