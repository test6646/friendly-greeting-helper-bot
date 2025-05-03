
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SellerProfileForm from '@/components/seller/SellerProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const CreateSellerProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if profile is already created (user object is fully populated)
    if (!loading && user && user.role === 'seller' && user.first_name && user.last_name) {
      navigate('/seller/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth?redirect=/seller/create-profile" />;
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Become a Seller</h1>
            <p className="text-gray-600">
              Create your seller profile to start selling your homemade meals on SheKaTiffin
            </p>
          </div>
          
          <SellerProfileForm />
          
          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800">What happens next?</h3>
            <ul className="list-disc pl-5 mt-2 text-blue-700 text-sm space-y-1">
              <li>After creating your profile, you can add meals to your menu</li>
              <li>Your profile will be verified by our team</li>
              <li>Once verified, your meals will be visible to customers</li>
              <li>You'll start receiving orders through the platform</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateSellerProfile;
