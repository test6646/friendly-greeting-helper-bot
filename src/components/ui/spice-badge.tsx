
import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-secondary text-white",
        destructive: "bg-destructive text-white",
        outline: "border border-input bg-background text-foreground",
        "outline-primary": "border-primary text-primary border",
        "outline-secondary": "border-secondary text-secondary border", 
        "outline-destructive": "border-destructive text-destructive border",
        "subtle-primary": "bg-primary/20 text-primary",
        "subtle-secondary": "bg-secondary/20 text-secondary",
        "subtle-destructive": "bg-destructive/20 text-destructive",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function SpiceBadge({
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), "font-poppins", className)} {...props} />
  );
}

export { SpiceBadge, badgeVariants };
