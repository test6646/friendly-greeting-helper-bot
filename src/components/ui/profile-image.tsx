
import React from 'react';
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProfileImageProps {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt = "Profile image",
  fallback,
  size = "md",
  className = "",
  fallbackClassName = "",
}) => {
  const [error, setError] = React.useState(false);
  
  // Size mappings for consistent sizing across the app
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };
  
  const containerClass = cn(
    "rounded-full overflow-hidden bg-primary/5 border-2 border-primary/10",
    sizeClasses[size],
    className
  );
  
  const handleError = () => setError(true);
  
  return (
    <div className={containerClass}>
      <AspectRatio ratio={1 / 1} className="w-full h-full">
        {!error && src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleError}
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center bg-primary/10",
            fallbackClassName
          )}>
            {fallback || <User className="w-1/2 h-1/2 text-primary/40" />}
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export { ProfileImage };
