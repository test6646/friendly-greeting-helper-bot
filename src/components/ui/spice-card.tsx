
import * as React from "react"
import { cn } from "@/lib/utils"

interface SpiceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "highlight";
}

export const SpiceCard = React.forwardRef<HTMLDivElement, SpiceCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg shadow-sm overflow-hidden",
          {
            "bg-white border border-gray-100": variant === "default",
            "bg-white/80 backdrop-blur-sm border border-white/50": variant === "glass",
            "bg-gradient-to-br from-primary/5 to-primary/20 border border-primary/10": variant === "highlight",
          },
          className
        )}
        {...props}
      />
    );
  }
);

SpiceCard.displayName = "SpiceCard";
