
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, X, UserRound, LogIn, ShoppingCart, Bell, ChevronDown, Truck, Store, Settings
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationBell from '../notifications/NotificationBell';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '../ui/avatar';

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ 
  to, 
  children,
  onClick 
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`transition-colors py-2 px-1 font-medium ${
        isActive 
          ? "text-primary font-semibold" 
          : "text-foreground/90 hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
};

const Navbar: React.FC = () => {
  const { user, signOut, loading, refreshUser } = useSimpleAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  useEffect(() => {
    // Debug authentication state
    console.log("Auth state in Navbar:", { user, loading });
    
    // If we're on the homepage and no user data is loaded yet, try to refresh
    const path = window.location.pathname;
    if (path === '/' && !loading && !user) {
      refreshUser();
    }
  }, [user, loading, refreshUser]);
  
  const closeMenu = () => setIsMenuOpen(false);
  
  const getInitials = () => {
    if (!user) return "U";
    return user.first_name?.charAt(0).toUpperCase() + (user.last_name?.charAt(0).toUpperCase() || "");
  };
  
  // Check if user is a customer (only customers see cart)
  const isCustomer = !user || user.role === 'customer';
  
  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Browse Meals', path: '/meals' },
    { title: 'Our Cooks', path: '/sellers' },
    { title: 'How It Works', path: '/how-it-works' },
  ];

  // Add role-specific links for logged-in users with professional roles
  if (user) {
    if (user.role === 'seller') {
      navLinks.push({ title: 'Seller Dashboard', path: '/seller/dashboard' });
    } else if (user.role === 'captain') {
      navLinks.push({ title: 'Captain Dashboard', path: '/captain/dashboard' });
    }
  }

  // Determine if we're authenticated
  const isAuthenticated = !!user;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${isScrolled ? 'bg-background/95 backdrop-blur shadow-sm' : 'bg-background'}`}>
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SheKaTiffin
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path}>
              {link.title}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? (
            // Show loading state while checking auth
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
          ) : isAuthenticated ? (
            <>
              {/* Only show cart for customers */}
              {isCustomer && (
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="text-foreground/90">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <UserAvatar 
                      src={user.profile_image_url} 
                      alt={`${user.first_name || 'User'}'s profile`}
                      fallback={getInitials()}
                      size="md"
                      className="border-2 border-primary/20"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.phone || user.email}
                      </p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 w-fit capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex items-center">
                      <UserRound className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=settings" className="cursor-pointer flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Add role-specific dashboard links */}
                  {user.role === 'seller' && (
                    <DropdownMenuItem asChild>
                      <Link to="/seller/dashboard" className="cursor-pointer flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        Seller Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {user.role === 'captain' && (
                    <DropdownMenuItem asChild>
                      <Link to="/captain/dashboard" className="cursor-pointer flex items-center">
                        <Truck className="mr-2 h-4 w-4" />
                        Captain Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center text-red-500 focus:text-red-500">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="default" size="sm">
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          {loading ? (
            // Mobile loading state
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse mr-2"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center mr-2">
              {/* Only show cart for customers */}
              {isCustomer && (
                <Link to="/cart" className="mr-2">
                  <Button variant="ghost" size="icon" className="text-foreground/90">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <NotificationBell />
            </div>
          ) : null}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
              <div className="flex flex-col h-full bg-background">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    SheKaTiffin
                  </span>
                  <Button variant="ghost" size="icon" onClick={closeMenu} className="h-8 w-8">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* User Profile (if logged in) */}
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-4 p-4 border-b">
                    <UserAvatar 
                      src={user.profile_image_url} 
                      alt={`${user.first_name || 'User'}'s profile`} 
                      size="md"
                      fallback={getInitials()}
                      className="border-2 border-primary/20"
                    />
                    <div>
                      <p className="font-medium text-base">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user.phone || user.email}</p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Navigation */}
                <nav className="flex flex-col p-4 space-y-3">
                  {navLinks.map((link) => (
                    <motion.div
                      key={link.path}
                      whileTap={{ scale: 0.97 }}
                    >
                      <NavLink to={link.path} onClick={closeMenu}>
                        {link.title}
                      </NavLink>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto p-4 border-t">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm" 
                        size="default"
                        onClick={() => { navigate('/profile'); closeMenu(); }}
                      >
                        <UserRound className="mr-2 h-4 w-4" />
                        My Profile
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm" 
                        size="default"
                        onClick={() => { navigate('/notifications'); closeMenu(); }}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm" 
                        size="default"
                        onClick={() => { handleSignOut(); closeMenu(); }}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full"
                      size="default"
                      onClick={() => { navigate('/auth'); closeMenu(); }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
