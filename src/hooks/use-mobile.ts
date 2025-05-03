
import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current device is mobile based on screen width
 * @param breakpoint The width threshold for mobile devices (default: 768px)
 * @returns Boolean indicating if the device is mobile
 */
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount and when window is resized
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
};
