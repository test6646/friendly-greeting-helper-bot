
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SpiceButton } from '@/components/ui/spice-button';
import { ChefHat } from 'lucide-react';

const NoSellerProfileMessage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="py-10">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <ChefHat className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold text-primary mb-2">Seller Profile Required</h2>
          <p className="text-primary/90 mb-6">
            You need to create a seller profile before you can access the dashboard and add meals.
          </p>
          <SpiceButton 
            onClick={() => navigate('/seller/create-profile')}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Create Seller Profile
          </SpiceButton>
        </div>
      </div>
    </div>
  );
};

export default NoSellerProfileMessage;
