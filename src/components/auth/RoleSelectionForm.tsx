
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Store, Truck, UserCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { motion } from 'framer-motion';

export type UserRole = 'customer' | 'seller' | 'captain';

interface RoleSelectionFormProps {
  onSelect: (role: UserRole) => void;
  initialRole?: UserRole;
}

const RoleSelectionForm: React.FC<RoleSelectionFormProps> = ({ onSelect, initialRole = 'customer' }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: "Selection Required",
        description: "Please select a role to continue",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    // Add a small delay to show the loading state for better UX
    setTimeout(() => {
      onSelect(selectedRole);
      setLoading(false);
    }, 500);
  };
  
  // Animation variants
  const cardVariants = {
    selected: { 
      scale: 1.02,
      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    },
    notSelected: { 
      scale: 1,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <ToggleGroup
          type="single"
          value={selectedRole}
          onValueChange={(value) => value && setSelectedRole(value as UserRole)}
          className="bg-muted p-1 rounded-lg"
        >
          <ToggleGroupItem value="customer" aria-label="Customer" className="data-[state=on]:bg-white dark:data-[state=on]:bg-gray-700 data-[state=on]:text-primary">
            <UserCircle className="h-4 w-4 mr-2" />
            Customer
          </ToggleGroupItem>
          <ToggleGroupItem value="seller" aria-label="Seller" className="data-[state=on]:bg-white dark:data-[state=on]:bg-gray-700 data-[state=on]:text-secondary">
            <Store className="h-4 w-4 mr-2" />
            Seller
          </ToggleGroupItem>
          <ToggleGroupItem value="captain" aria-label="Captain" className="data-[state=on]:bg-white dark:data-[state=on]:bg-gray-700 data-[state=on]:text-destructive">
            <Truck className="h-4 w-4 mr-2" />
            Captain
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <RadioGroup 
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as UserRole)}
          className="grid gap-4"
        >
          <motion.div
            variants={cardVariants}
            animate={selectedRole === 'customer' ? 'selected' : 'notSelected'}
            className={`relative cursor-pointer rounded-lg border-2 p-4 ${
              selectedRole === 'customer' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
            onClick={() => setSelectedRole('customer')}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${selectedRole === 'customer' ? 'bg-primary/10' : 'bg-muted'}`}>
                <UserCircle className={`h-8 w-8 ${selectedRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg">Customer</div>
                <div className="text-muted-foreground">Order homemade food from local chefs</div>
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Browse meals from home chefs in your area</li>
                  <li>Place orders for delivery or pickup</li>
                  <li>Track your order status in real-time</li>
                </ul>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            animate={selectedRole === 'seller' ? 'selected' : 'notSelected'}
            className={`relative cursor-pointer rounded-lg border-2 p-4 ${
              selectedRole === 'seller' ? 'border-secondary bg-secondary/5' : 'border-muted'
            }`}
            onClick={() => setSelectedRole('seller')}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${selectedRole === 'seller' ? 'bg-secondary/10' : 'bg-muted'}`}>
                <Store className={`h-8 w-8 ${selectedRole === 'seller' ? 'text-secondary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg">Seller/Chef</div>
                <div className="text-muted-foreground">Sell your homemade food on our platform</div>
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>List your specialty dishes and set your prices</li>
                  <li>Manage orders and your kitchen schedule</li>
                  <li>Connect with customers who love your food</li>
                </ul>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            animate={selectedRole === 'captain' ? 'selected' : 'notSelected'}
            className={`relative cursor-pointer rounded-lg border-2 p-4 ${
              selectedRole === 'captain' ? 'border-destructive bg-destructive/5' : 'border-muted'
            }`}
            onClick={() => setSelectedRole('captain')}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${selectedRole === 'captain' ? 'bg-destructive/10' : 'bg-muted'}`}>
                <Truck className={`h-8 w-8 ${selectedRole === 'captain' ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg">Delivery Captain</div>
                <div className="text-muted-foreground">Deliver food and earn money</div>
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Choose your own delivery hours</li>
                  <li>Earn competitive pay per delivery</li>
                  <li>Use your motorcycle, bicycle, or car</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </RadioGroup>
        
        <Button 
          type="submit" 
          className="w-full py-6 text-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue as {selectedRole === 'customer' ? 'Customer' : selectedRole === 'seller' ? 'Seller' : 'Captain'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default RoleSelectionForm;
