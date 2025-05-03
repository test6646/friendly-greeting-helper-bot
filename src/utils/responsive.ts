
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Get responsive font size based on device type
 * @param mobileFontSize Font size for mobile devices
 * @param desktopFontSize Font size for desktop devices
 * @returns The appropriate font size for current device
 */
export function getResponsiveFontSize(mobileFontSize: string, desktopFontSize: string): string {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? mobileFontSize : desktopFontSize;
  }
  return desktopFontSize; // Default to desktop size if window is not available
}

/**
 * React hook version of getResponsiveFontSize
 * @param mobileFontSize Font size for mobile devices
 * @param desktopFontSize Font size for desktop devices
 * @returns The appropriate font size for current device
 */
export function useResponsiveFontSize(mobileFontSize: string, desktopFontSize: string): string {
  const isMobile = useIsMobile();
  return isMobile ? mobileFontSize : desktopFontSize;
}

/**
 * Get responsive padding based on device type
 * @param mobilePadding Padding for mobile devices
 * @param desktopPadding Padding for desktop devices
 * @returns The appropriate padding for current device
 */
export function getResponsivePadding(mobilePadding: string, desktopPadding: string): string {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? mobilePadding : desktopPadding;
  }
  return desktopPadding; // Default to desktop padding if window is not available
}

/**
 * React hook version of getResponsivePadding
 * @param mobilePadding Padding for mobile devices
 * @param desktopPadding Padding for desktop devices
 * @returns The appropriate padding for current device
 */
export function useResponsivePadding(mobilePadding: string, desktopPadding: string): string {
  const isMobile = useIsMobile();
  return isMobile ? mobilePadding : desktopPadding;
}

/**
 * Get responsive spacing based on device type
 * These are specifically for Tailwind spacing utilities
 * @param mobileSpacing Spacing class for mobile devices (e.g., "space-y-2")
 * @param desktopSpacing Spacing class for desktop devices (e.g., "space-y-4")
 * @returns The appropriate spacing class for current device
 */
export function getResponsiveSpacing(mobileSpacing: string, desktopSpacing: string): string {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? mobileSpacing : desktopSpacing;
  }
  return desktopSpacing; // Default to desktop spacing if window is not available
}

/**
 * React hook version of getResponsiveSpacing
 * @param mobileSpacing Spacing class for mobile devices
 * @param desktopSpacing Spacing class for desktop devices
 * @returns The appropriate spacing class for current device
 */
export function useResponsiveSpacing(mobileSpacing: string, desktopSpacing: string): string {
  const isMobile = useIsMobile();
  return isMobile ? mobileSpacing : desktopSpacing;
}
