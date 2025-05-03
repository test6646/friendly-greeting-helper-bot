
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Pencil, Trash, Check } from 'lucide-react';

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type: string;
  is_default: boolean;
}

interface AddressFormProps {
  userId: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ userId }) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    type: 'home',
    is_default: false
  });

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        if (error) throw error;
        setAddresses(data || []);
      } catch (error: any) {
        console.error('Error fetching addresses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load addresses',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  // Reset form
  const resetForm = () => {
    setFormData({
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      type: 'home',
      is_default: false
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  // Load address for editing
  const handleEdit = (address: Address) => {
    setFormData({
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      type: address.type,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  // Delete address
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAddresses(addresses.filter(address => address.id !== id));
      toast({
        title: 'Success',
        description: 'Address deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Set address as default
  const setAsDefault = async (id: string) => {
    try {
      setLoading(true);
      
      // First, set all addresses to non-default
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
      
      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      const updatedAddresses = addresses.map(address => ({
        ...address,
        is_default: address.id === id
      }));
      
      setAddresses(updatedAddresses);
      
      toast({
        title: 'Success',
        description: 'Default address updated'
      });
    } catch (error: any) {
      console.error('Error updating default address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            type: formData.type
          })
          .eq('id', editingId);

        if (error) throw error;
        
        // If setting as default, update all addresses
        if (formData.is_default) {
          await setAsDefault(editingId);
        }
        
        // Update local state
        const updatedAddresses = addresses.map(address => 
          address.id === editingId 
            ? { 
                ...address, 
                ...formData,
                is_default: address.is_default || formData.is_default
              } 
            : formData.is_default 
              ? { ...address, is_default: false }
              : address
        );
        
        setAddresses(updatedAddresses);
        
        toast({
          title: 'Success',
          description: 'Address updated successfully'
        });
      } else {
        // Create new address
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: userId,
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            type: formData.type,
            is_default: formData.is_default || addresses.length === 0 // First address is default
          })
          .select();

        if (error) throw error;
        
        // If setting as default, update all other addresses
        if (formData.is_default && data?.[0]?.id) {
          await setAsDefault(data[0].id);
        }
        
        // If this is the first address, make it default
        if (addresses.length === 0) {
          const newAddress = data?.[0] as Address;
          setAddresses([newAddress]);
        } else if (formData.is_default) {
          // If marked as default, update all addresses
          const newAddress = data?.[0] as Address;
          const updatedAddresses = [
            newAddress,
            ...addresses.map(address => ({ ...address, is_default: false }))
          ];
          setAddresses(updatedAddresses);
        } else {
          // Just add the new address
          const newAddress = data?.[0] as Address;
          setAddresses([...addresses, newAddress]);
        }
        
        toast({
          title: 'Success',
          description: 'Address added successfully'
        });
      }
      
      // Reset form
      resetForm();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Address List */}
      {addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {addresses.map((address) => (
            <Card key={address.id} className={`overflow-hidden transition-all duration-200 ${address.is_default ? 'border-primary' : 'border-gray-100'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full mr-2 capitalize ${
                      address.type === 'home' ? 'bg-blue-100 text-blue-800' :
                      address.type === 'work' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {address.type}
                    </span>
                    {address.is_default && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-primary"
                      onClick={() => handleEdit(address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="font-medium">
                    {address.line1}
                  </p>
                  {address.line2 && (
                    <p className="text-gray-600 text-sm">
                      {address.line2}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm">
                    {address.city}, {address.state} - {address.postal_code}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {address.country}
                  </p>
                </div>
                
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs border-primary text-primary hover:bg-primary/10"
                    onClick={() => setAsDefault(address.id)}
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {addresses.length === 0 && !showAddForm && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first delivery address to get started.</p>
          <div className="mt-6">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Address Form */}
      {showAddForm ? (
        <Card className="border-gray-200 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="line1">Address Line 1 *</Label>
                  <Input
                    id="line1"
                    value={formData.line1}
                    onChange={(e) => setFormData({...formData, line1: e.target.value})}
                    placeholder="Street address, P.O. box, etc."
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    value={formData.line2}
                    onChange={(e) => setFormData({...formData, line2: e.target.value})}
                    placeholder="Apartment, suite, unit, building, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Address Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="home" className="border-2 text-primary" />
                    <Label htmlFor="home">Home</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="work" id="work" className="border-2 text-primary" />
                    <Label htmlFor="work">Work</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" className="border-2 text-primary" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_default" className="text-sm">
                  Set as default address
                </Label>
              </div>
              
              <div className="pt-4 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? "Saving..." : (editingId ? "Update Address" : "Add Address")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        !loading && addresses.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        )
      )}
    </div>
  );
};

export default AddressForm;
