
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Conditionally renders content based on screen size
 */
export const ResponsiveView: React.FC<{
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}> = ({ mobile, desktop }) => {
  const isMobile = useIsMobile();
  return <>{isMobile ? mobile : desktop}</>;
};

/**
 * Makes text responsive with different sizes for mobile and desktop
 */
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  mobileClassName?: string;
  desktopClassName?: string;
  className?: string;
}> = ({ 
  children, 
  mobileClassName = "text-xs", 
  desktopClassName = "text-sm", 
  className = ""
}) => {
  const isMobile = useIsMobile();
  const responsiveClass = isMobile ? mobileClassName : desktopClassName;
  
  return (
    <span className={`${responsiveClass} ${className}`}>
      {children}
    </span>
  );
};

/**
 * Creates a responsive container with appropriate spacing for mobile/desktop
 */
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`
      ${isMobile ? 'px-2 py-3 space-y-2' : 'px-4 py-5 space-y-4'}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Responsive grid component that changes columns based on screen size
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  mobileColumns?: 1 | 2;
  tabletColumns?: 2 | 3;
  desktopColumns?: 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ 
  children, 
  mobileColumns = 1, 
  tabletColumns = 2, 
  desktopColumns = 3,
  gap = 'medium',
  className = ""
}) => {
  // Translate gap size to Tailwind classes
  const gapClass = {
    small: 'gap-2 md:gap-3 lg:gap-4',
    medium: 'gap-3 md:gap-4 lg:gap-5',
    large: 'gap-4 md:gap-6 lg:gap-8',
  }[gap];
  
  // Build grid columns class
  const columnsClass = `grid-cols-${mobileColumns} md:grid-cols-${tabletColumns} lg:grid-cols-${desktopColumns}`;
  
  return (
    <div className={`grid ${columnsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Touch-friendly button with appropriate sizing for mobile
 */
export const TouchFriendlyButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  disabled?: boolean;
}> = ({ children, onClick, className = "", variant = "default", disabled = false }) => {
  const isMobile = useIsMobile();
  
  // Ensure touch targets are at least 44×44 pixels on mobile
  const baseClass = 'rounded-md text-center transition-colors';
  const sizeClass = isMobile ? 'min-h-[44px] min-w-[44px] px-3 py-2' : 'min-h-[36px] px-4 py-2';
  
  // Apply variant styling
  const variantClass = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  }[variant];
  
  // Disabled state
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${sizeClass} ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
};
