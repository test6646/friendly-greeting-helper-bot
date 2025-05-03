
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { User, ChefHat, Truck, LogOut, Settings } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const NavbarEnhanced = () => {
  const { user, signOut } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Update authentication state when user changes
    setIsAuthenticated(!!user);
    console.log("NavbarEnhanced: auth state updated:", !!user);
  }, [user]);
  
  if (!isAuthenticated) return null;

  // Get role-specific dashboard icon and link
  const getDashboardInfo = () => {
    if (!user) return { 
      icon: <User className="h-5 w-5" />,
      title: "Profile", 
      link: "/profile"
    };
    
    switch (user.role) {
      case 'seller':
        return { 
          icon: <ChefHat className="h-5 w-5" />,
          title: "Seller Dashboard",
          link: "/seller/dashboard"
        };
      case 'captain':
        return { 
          icon: <Truck className="h-5 w-5" />,
          title: "Captain Dashboard", 
          link: "/captain/dashboard"
        };
      default:
        return { 
          icon: <User className="h-5 w-5" />,
          title: "Profile", 
          link: "/profile"
        };
    }
  };

  const dashboardInfo = getDashboardInfo();

  return (
    <div className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={dashboardInfo.link} className="flex items-center space-x-2">
            <div className="text-primary">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:block">
              SheKaTiffin
            </span>
          </Link>
          
          {/* Dashboard Title */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold">{dashboardInfo.title}</h1>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user?.profile_image_url ? (
                    <img 
                      src={user.profile_image_url} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.phone}</p>
                  {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                </div>
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link to={dashboardInfo.link}>
                      {dashboardInfo.icon}
                      <span className="ml-2">{dashboardInfo.title}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">
                      <NotificationBell className="mr-2" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <div className="py-1 border-t border-border">
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarEnhanced;
