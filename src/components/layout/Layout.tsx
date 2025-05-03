
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  mobilePadding?: "normal" | "compact" | "none";
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  fullWidth = false,
  mobilePadding = "normal",
  hideNavbar = false,
  hideFooter = false
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Automatically hide navbar and footer on auth page
  const isAuthPage = location.pathname === '/auth';
  const shouldHideNavbar = hideNavbar || isAuthPage;
  const shouldHideFooter = hideFooter || isAuthPage;
  
  const getPaddingClasses = () => {
    if (fullWidth) return "";
    
    switch (mobilePadding) {
      case "compact":
        return "px-2 py-2 md:px-6 md:py-6 lg:py-8";
      case "none":
        return "md:px-6 md:py-6 lg:py-8";
      case "normal":
      default:
        return "px-3 py-3 md:px-6 md:py-6 lg:py-8";
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral text-foreground font-nunito overflow-x-hidden">
      {!shouldHideNavbar && <Navbar />}
      <motion.main 
        className={`flex-grow ${fullWidth ? 'w-full' : `container mx-auto ${getPaddingClasses()}`}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ 
          fontSize: isMobile ? '0.95rem' : '1rem',
          lineHeight: isMobile ? '1.4' : '1.5'
        }}
      >
        {children}
      </motion.main>
      {!shouldHideFooter && <Footer />}
      <Toaster />
    </div>
  );
};

export default Layout;
