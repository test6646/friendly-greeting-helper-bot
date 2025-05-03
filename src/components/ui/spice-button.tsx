
import * as React from "react"
import { cn } from "@/lib/utils"

interface SpiceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const SpiceButton = React.forwardRef<HTMLButtonElement, SpiceButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "default", 
    isLoading = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm hover:shadow-md",
          {
            "bg-saffron text-white hover:bg-saffron/90": variant === "primary",
            "bg-cardamom text-white hover:bg-cardamom/90": variant === "secondary",
            "border border-saffron text-saffron hover:bg-saffron/10": variant === "outline",
            "bg-transparent hover:bg-gray-100": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 text-sm": size === "sm",
            "h-12 px-6 text-lg": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          "disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 whitespace-nowrap",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

SpiceButton.displayName = "SpiceButton";
