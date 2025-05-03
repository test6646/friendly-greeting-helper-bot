
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SpiceButton } from '@/components/ui/spice-button';
import { Plus } from 'lucide-react';

const DashboardHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <p className="text-gray-600">Manage your meals and track your business</p>
      </div>
      
      <SpiceButton
        onClick={() => navigate('/seller/add-meal')}
        className="bg-saffron hover:bg-saffron/90 text-white"
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Meal
      </SpiceButton>
    </div>
  );
};

export default DashboardHeader;
