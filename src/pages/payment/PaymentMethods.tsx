import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, PlusCircle, Edit2, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

// Define the payment method schema
const paymentMethodSchema = z.object({
  cardNumber: z.string()
    .min(16, "Card number must be 16 digits")
    .max(19, "Card number must not exceed 19 characters")
    .refine((val) => /^[0-9\s-]+$/.test(val), {
      message: "Card number must contain only digits, spaces or dashes"
    }),
  cardholderName: z.string().min(3, "Cardholder name is required"),
  expiryDate: z.string()
    .min(5, "Expiry date must be in MM/YY format")
    .max(5, "Expiry date must be in MM/YY format")
    .refine((val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), {
      message: "Expiry date must be in MM/YY format"
    }),
  cvv: z.string()
    .min(3, "CVV must be 3 digits")
    .max(4, "CVV must not exceed 4 digits")
    .refine((val) => /^\d+$/.test(val), {
      message: "CVV must contain only digits"
    }),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

// Mock payment methods for demonstration
const mockPaymentMethods = [
  {
    id: 'pm_1',
    last4: '4242',
    brand: 'Visa',
    holderName: 'John Doe',
    expiryMonth: 12,
    expiryYear: 25,
    isDefault: true
  },
  {
    id: 'pm_2',
    last4: '5555',
    brand: 'Mastercard',
    holderName: 'John Doe',
    expiryMonth: 10,
    expiryYear: 24,
    isDefault: false
  }
];

const PaymentMethods = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form setup
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: '',
    }
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    setIsLoading(true);
    
    try {
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract month and year from expiry date
      const [expiryMonth, expiryYear] = data.expiryDate.split('/');
      
      // Simulate adding a new payment method
      const newPaymentMethod = {
        id: `pm_${Date.now()}`,
        last4: data.cardNumber.slice(-4),
        brand: getCardBrand(data.cardNumber),
        holderName: data.cardholderName,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        isDefault: paymentMethods.length === 0 // Make default if it's the first card
      };
      
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      toast.success('Payment method added successfully');
      
      // Close the dialog and reset form
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add payment method');
      console.error('Error adding payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    toast.success('Payment method removed');
  };

  const handleSetAsDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    toast.success('Default payment method updated');
  };

  const getCardBrand = (cardNumber: string) => {
    const prefix = cardNumber.replace(/\s+/g, '').slice(0, 1);
    if (prefix === '4') return 'Visa';
    if (prefix === '5') return 'Mastercard';
    if (prefix === '3') return 'Amex';
    if (prefix === '6') return 'Discover';
    return 'Unknown';
  };

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
    
    form.setValue('cardNumber', formattedValue);
  };

  const formatExpiryDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (value.length <= 2) {
      form.setValue('expiryDate', value);
    } else {
      form.setValue('expiryDate', `${value.slice(0, 2)}/${value.slice(2, 4)}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Payment Methods</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Enter your card details to add a new payment method.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1234 5678 9012 3456" 
                            {...field} 
                            onChange={(e) => {
                              formatCardNumber(e);
                            }}
                            maxLength={19}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cardholderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardholder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="MM/YY"
                              {...field} 
                              onChange={(e) => {
                                formatExpiryDate(e);
                              }}
                              maxLength={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123" 
                              type="password" 
                              {...field}
                              maxLength={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Payment Method'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-4">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <Card key={method.id} className={method.isDefault ? "border-primary/40" : ""}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      {method.brand}
                    </CardTitle>
                    <CardDescription>
                      •••• •••• •••• {method.last4}
                    </CardDescription>
                  </div>
                  {method.isDefault && (
                    <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm">{method.holderName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-3">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                  {!method.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetAsDefault(method.id)}
                    >
                      Set as default
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No payment methods</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                You don't have any payment methods saved yet. Add a payment method to place orders quickly.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentMethods;
