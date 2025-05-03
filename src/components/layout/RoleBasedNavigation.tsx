
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import { 
  Home, ShoppingBag, ChevronDown, Menu, Search,
  Calendar, MessageCircle, Bell, LogOut, User,
  Truck, ChefHat, Users
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export const RoleBasedNavigation = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Don't show navigation for seller and captain roles as they have dedicated dashboards
  if (!user || user.role === 'seller' || user.role === 'captain') {
    return null;
  }

  // Consumer links
  const consumerLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Browse Meals', path: '/meals', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Meet Our Cooks', path: '/sellers', icon: <ChefHat className="w-5 h-5" /> },
    { name: 'How It Works', path: '/how-it-works', icon: <MessageCircle className="w-5 h-5" /> },
  ];

  // Select the appropriate links based on user role
  const navLinks = consumerLinks;
  const isActive = (path: string) => location.pathname === path;

  // Mobile navigation
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <nav className="flex flex-col gap-4 mt-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-primary/5 text-foreground"
                )}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            <hr className="my-2" />
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-3 px-3"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop navigation
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {navLinks.map((link) => (
          <NavigationMenuItem key={link.path}>
            <Link
              to={link.path}
              className={cn(
                navigationMenuTriggerStyle(),
                isActive(link.path) && "bg-primary/10 text-primary"
              )}
            >
              <span className="flex items-center gap-2">
                {link.icon}
                {link.name}
              </span>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default RoleBasedNavigation;
