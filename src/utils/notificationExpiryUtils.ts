
// Check if notification is expired (2 minutes from creation)
export const isNotificationExpired = (notification: any): boolean => {
  if (!notification || !notification.created_at) return true;
  
  const createdAt = new Date(notification.created_at);
  const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000); // 2 minutes
  
  return Date.now() > expiryTime.getTime();
};

// Setup timeout for notification expiry
export const setupNotificationTimeout = (
  notification: any, 
  existingTimeout: NodeJS.Timeout | undefined,
  onExpire: () => void
): NodeJS.Timeout => {
  // Clear existing timeout if any
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  // Calculate remaining time until expiry
  if (!notification || !notification.created_at) {
    return setTimeout(onExpire, 0);
  }
  
  const createdAt = new Date(notification.created_at);
  const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000); // 2 minutes
  const timeRemaining = Math.max(0, expiryTime.getTime() - Date.now());
  
  console.log(`Setting timeout for notification to expire in ${timeRemaining}ms`);
  
  // Set new timeout
  return setTimeout(() => {
    console.log('Notification timeout triggered');
    onExpire();
  }, timeRemaining);
};
