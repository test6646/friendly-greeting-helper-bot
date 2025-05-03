
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  errorMessage?: string;
  label?: string;
  mobileStyles?: string;
  desktopStyles?: string;
  className?: string;
  fullWidth?: boolean;
}

const ResponsiveInput = React.forwardRef<HTMLInputElement, ResponsiveInputProps>(
  ({ className, type, mobileStyles, desktopStyles, icon, errorMessage, label, id, fullWidth = true, ...props }, ref) => {
    const isMobile = useIsMobile();

    // Enhanced styles for better mobile experience
    const baseStyles = "flex rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    
    // Adjusted sizes for better mobile experience
    const mobileDefaultStyles = "h-12 text-base px-4 py-3"; // Increased height and padding for better touch targets
    const desktopDefaultStyles = "h-11 text-sm px-4 py-2.5";
    
    const responsiveStyles = isMobile 
      ? `${mobileDefaultStyles} ${mobileStyles || ''}` 
      : `${desktopDefaultStyles} ${desktopStyles || ''}`;
    
    const widthClass = fullWidth ? "w-full" : "";
    
    const inputStyles = cn(
      baseStyles, 
      responsiveStyles,
      widthClass,
      icon ? "pl-10" : "", // Increased left padding for icon
      errorMessage ? "border-destructive" : "",
      className
    );

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label 
            htmlFor={id} 
            className="text-sm font-medium block mb-2 text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            className={inputStyles}
            ref={ref}
            {...props}
            style={{
              fontSize: isMobile ? '16px' : undefined, // Prevents zoom on focus in iOS
            }}
          />
        </div>
        {errorMessage && (
          <p className="text-xs text-destructive mt-1.5">{errorMessage}</p>
        )}
      </div>
    );
  }
);
ResponsiveInput.displayName = "ResponsiveInput";

export { ResponsiveInput };
