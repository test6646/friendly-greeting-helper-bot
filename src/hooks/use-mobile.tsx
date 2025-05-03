
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create a media query list
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Handler function that sets state based on media query
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    
    // Check initial state
    handleChange(mql);
    
    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else if ('addListener' in mql) {
      // @ts-ignore - For older browsers that don't have addEventListener
      mql.addListener(handleChange);
      return () => {
        // @ts-ignore - For older browsers
        mql.removeListener(handleChange);
      };
    }
    
    // Fallback if nothing else works
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [])

  return isMobile
}

// Utility function that returns responsive values based on screen size
export function responsive<T>(mobileValue: T, desktopValue: T): T {
  const isMobile = useIsMobile();
  return isMobile ? mobileValue : desktopValue;
}
