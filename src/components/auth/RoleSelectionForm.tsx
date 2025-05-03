
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Store, Truck, UserCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'customer' | 'seller' | 'captain';

interface RoleSelectionFormProps {
  onSelect: (role: UserRole) => void;
  initialRole?: UserRole;
}

const RoleSelectionForm: React.FC<RoleSelectionFormProps> = ({ onSelect, initialRole = 'customer' }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
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
    
    onSelect(selectedRole);
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Choose Your Role</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup 
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            className="grid gap-4"
          >
            <Label 
              htmlFor="customer-role"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                selectedRole === 'customer' ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="customer" id="customer-role" className="text-primary" />
              <div className="flex-1">
                <div className="font-medium text-lg">Customer</div>
                <div className="text-muted-foreground">Order homemade food from local chefs</div>
              </div>
              <UserCircle className={`h-8 w-8 ${selectedRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
            </Label>
            
            <Label 
              htmlFor="seller-role"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                selectedRole === 'seller' ? 'border-secondary bg-secondary/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="seller" id="seller-role" className="text-secondary" />
              <div className="flex-1">
                <div className="font-medium text-lg">Seller/Chef</div>
                <div className="text-muted-foreground">Sell your homemade food on our platform</div>
              </div>
              <Store className={`h-8 w-8 ${selectedRole === 'seller' ? 'text-secondary' : 'text-muted-foreground'}`} />
            </Label>
            
            <Label 
              htmlFor="captain-role"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                selectedRole === 'captain' ? 'border-destructive bg-destructive/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="captain" id="captain-role" className="text-destructive" />
              <div className="flex-1">
                <div className="font-medium text-lg">Delivery Captain</div>
                <div className="text-muted-foreground">Deliver food and earn money</div>
              </div>
              <Truck className={`h-8 w-8 ${selectedRole === 'captain' ? 'text-destructive' : 'text-muted-foreground'}`} />
            </Label>
          </RadioGroup>
          
          <Button type="submit" className="w-full">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RoleSelectionForm;
