
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mobileStyles?: string;
  desktopStyles?: string;
  error?: boolean;
  errorMessage?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, mobileStyles, desktopStyles, error, errorMessage, ...props }, ref) => {
    const isMobile = useIsMobile();

    // Default styles with mobile-optimized adjustments
    const baseStyles = "flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    
    const mobileDefaultStyles = "text-base px-3 py-2"; // Increased font size for better readability on mobile
    const desktopDefaultStyles = "text-sm px-3 py-2";
    
    const responsiveStyles = isMobile 
      ? `${mobileDefaultStyles} ${mobileStyles || ''}` 
      : `${desktopDefaultStyles} ${desktopStyles || ''}`;
    
    return (
      <div className="w-full">
        <textarea
          className={cn(
            baseStyles, 
            responsiveStyles,
            error ? "border-destructive" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {errorMessage && (
          <p className="text-xs text-destructive mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
