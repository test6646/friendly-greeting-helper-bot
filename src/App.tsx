import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import RoleBasedIndex from './pages/RoleBasedIndex';
import SimpleAuth from './pages/auth/SimpleAuth';
import MealsPage from './pages/meals/MealsPage';
import MealDetails from './pages/meals/MealDetails';
import CartPage from './pages/cart/CartPage';
import EnhancedCartPage from './pages/cart/EnhancedCartPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import OrderConfirmation from './pages/orders/OrderConfirmation';
import HowItWorks from './pages/HowItWorks';
import NotFound from './pages/NotFound';
import SellersPage from './pages/sellers/SellersPage';
import PaymentMethods from './pages/payment/PaymentMethods';

// Seller Pages
import SellerDashboard from './pages/seller/Dashboard';
import AddMeal from './pages/seller/AddMeal';
import EditMeal from './pages/seller/EditMeal';
import SellerVerification from './pages/seller/SellerVerification';
import CreateSellerProfile from './pages/seller/CreateSellerProfile';

// Captain Pages
import CaptainDashboardPage from './pages/captain/Dashboard';

// Providers
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import { ThemeProvider } from './components/ui/theme-provider';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import { preloadNotificationSounds } from './utils/notificationSounds';
import { useSimpleAuth } from './contexts/SimpleAuthContext';
import { Loader2 } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Improved route guard for authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useSimpleAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div>Checking authentication...</div>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Improved route guard for role-specific routes
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useSimpleAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div>Checking permissions...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleBasedIndex />} />
      <Route path="/auth" element={<SimpleAuth />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/meals" element={<MealsPage />} />
      <Route path="/meals/:id" element={<MealDetails />} />
      <Route path="/sellers" element={<SellersPage />} />
      
      {/* Protected Routes */}
      <Route path="/cart" element={
        <ProtectedRoute>
          <EnhancedCartPage />
        </ProtectedRoute>
      } />
      
      <Route path="/cart-old" element={
        <ProtectedRoute>
          <CartPage />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/order-confirmation/:id" element={
        <ProtectedRoute>
          <OrderConfirmation />
        </ProtectedRoute>
      } />
      
      <Route path="/payment-methods" element={
        <ProtectedRoute>
          <PaymentMethods />
        </ProtectedRoute>
      } />
      
      {/* Seller Routes */}
      <Route path="/seller/dashboard" element={
        <RoleProtectedRoute allowedRoles={['seller']}>
          <SellerDashboard />
        </RoleProtectedRoute>
      } />
      
      <Route path="/seller/add-meal" element={
        <RoleProtectedRoute allowedRoles={['seller']}>
          <AddMeal />
        </RoleProtectedRoute>
      } />
      
      <Route path="/seller/edit-meal/:id" element={
        <RoleProtectedRoute allowedRoles={['seller']}>
          <EditMeal />
        </RoleProtectedRoute>
      } />
      
      <Route path="/seller/verification" element={
        <RoleProtectedRoute allowedRoles={['seller']}>
          <SellerVerification />
        </RoleProtectedRoute>
      } />
      
      <Route path="/seller/create-profile" element={
        <RoleProtectedRoute allowedRoles={['seller']}>
          <CreateSellerProfile />
        </RoleProtectedRoute>
      } />
      
      {/* Captain Routes */}
      <Route path="/captain/dashboard" element={
        <RoleProtectedRoute allowedRoles={['captain']}>
          <CaptainDashboardPage />
        </RoleProtectedRoute>
      } />
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // Preload notification sounds for faster playback
  useEffect(() => {
    preloadNotificationSounds();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sheka-theme">
        <SimpleAuthProvider>
          <NotificationProvider>
            <Router>
              <AppRoutes />
            </Router>
            
            {/* Toast notifications */}
            <Toaster />
            <SonnerToaster position="top-right" />
          </NotificationProvider>
        </SimpleAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
