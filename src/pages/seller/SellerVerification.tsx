
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SellerVerificationForm from '@/components/profile/SellerVerificationForm';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const SellerVerification = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!loading && !user) {
      navigate('/auth');
    }
    
    // If user is not a seller, redirect to home page
    if (!loading && user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login
  }
  
  return (
    <Layout>
      <div className="py-12 px-4 md:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Seller Verification
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Complete your seller verification to start selling homemade meals on SheKaTiffin. 
              For testing purposes, your account will be automatically verified after document upload.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {user && <SellerVerificationForm userId={user.id} />}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerVerification;
