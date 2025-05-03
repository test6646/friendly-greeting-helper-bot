
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Plus, AlertCircle } from 'lucide-react';

interface PaymentMethodsProps {
  userId: string;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ userId }) => {
  // In a real app, we would fetch payment methods from the database
  // For now, this is just UI placeholder
  
  return (
    <div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Coming Soon
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Online payment methods are coming soon. Currently, we support Cash on Delivery for all orders.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
        <p className="mt-1 text-sm text-gray-500">Add a payment method to enable faster checkout.</p>
        <div className="mt-6">
          <Button 
            disabled 
            className="inline-flex items-center"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Supported Payment Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="flex items-center justify-center p-4 h-20">
              <div className="text-center">
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-xs text-green-600">Available</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 opacity-50">
            <CardContent className="flex items-center justify-center p-4 h-20">
              <div className="text-center">
                <p className="font-medium">Credit/Debit Card</p>
                <p className="text-xs text-gray-500">Coming Soon</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 opacity-50">
            <CardContent className="flex items-center justify-center p-4 h-20">
              <div className="text-center">
                <p className="font-medium">UPI</p>
                <p className="text-xs text-gray-500">Coming Soon</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 opacity-50">
            <CardContent className="flex items-center justify-center p-4 h-20">
              <div className="text-center">
                <p className="font-medium">Digital Wallets</p>
                <p className="text-xs text-gray-500">Coming Soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
