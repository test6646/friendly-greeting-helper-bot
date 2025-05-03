
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  // Size classes for consistent sizing
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  
  // Radio button sizes
  const radioSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

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
            "flex items-center space-x-2",
            orientation === 'horizontal' ? "mr-4 mb-2" : "mb-2"
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
              sizeClasses[size]
            )}
          >
            {option.icon && <span className="mr-1.5">{option.icon}</span>}
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
