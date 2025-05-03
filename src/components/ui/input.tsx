
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mobileStyles?: string;
  desktopStyles?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mobileStyles, desktopStyles, ...props }, ref) => {
    const isMobile = useIsMobile();

    // Enhanced styles with mobile-optimized adjustments
    const baseStyles = "flex rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    
    const mobileDefaultStyles = "h-12 text-base px-4 py-3"; // Increased height for better touch targets
    const desktopDefaultStyles = "h-10 text-base px-3 py-2";
    
    const responsiveStyles = isMobile 
      ? `${mobileDefaultStyles} ${mobileStyles || ''}` 
      : `${desktopDefaultStyles} ${desktopStyles || ''}`;
    
    return (
      <input
        type={type}
        className={cn(baseStyles, responsiveStyles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
