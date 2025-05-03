
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface RadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ResponsiveRadioGroupProps {
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
}

export function ResponsiveRadioGroup({
  options,
  value,
  onValueChange,
  orientation = 'horizontal',
  size = 'md',
  className,
  name
}: ResponsiveRadioGroupProps) {
  const isMobile = useIsMobile();
  
  // Size classes for consistent sizing
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  
  // Radio button sizes - larger on mobile for better touch targets
  const radioSizes = {
    sm: isMobile ? "h-5 w-5" : "h-4 w-4",
    md: isMobile ? "h-6 w-6" : "h-5 w-5",
    lg: isMobile ? "h-7 w-7" : "h-6 w-6",
  };
  
  // Spacing adjustments for mobile
  const spacingClass = isMobile ? "space-x-3" : "space-x-2";

  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "flex gap-2",
        orientation === 'horizontal' ? "flex-wrap" : "flex-col",
        className
      )}
    >
      {options.map((option) => (
        <div 
          key={option.value}
          className={cn(
            "flex items-center",
            spacingClass,
            orientation === 'horizontal' ? "mr-4 mb-2" : "mb-3"
          )}
        >
          <RadioGroupItem 
            value={option.value} 
            id={`${name}-${option.value}`}
            className={cn(
              "border-2 text-primary",
              radioSizes[size]
            )}
          />
          <Label 
            htmlFor={`${name}-${option.value}`} 
            className={cn(
              "flex items-center cursor-pointer",
              sizeClasses[size],
              isMobile ? "text-base" : "",
              "min-h-[44px] flex items-center" // Ensure minimum touch target size on mobile
            )}
          >
            {option.icon && <span className="mr-1.5">{option.icon}</span>}
            <div>
              <div>{option.label}</div>
              {option.description && (
                <div className="text-xs text-muted-foreground">{option.description}</div>
              )}
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
