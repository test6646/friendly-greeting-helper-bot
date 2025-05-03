
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { SpiceButton } from '@/components/ui/spice-button';
import { Meal } from '@/services/mealService';
import { Loader2, Edit, Trash, Eye } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

interface SellerMealsTabProps {
  sellerId?: string;
}

const SellerMealsTab: React.FC<SellerMealsTabProps> = ({ sellerId }) => {
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [sellerProfile, setSellerProfile] = useState<{id: string, verification_status: string} | null>(null);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!sellerId) return;
      
      try {
        console.log('Fetching seller profile for ID:', sellerId);
        
        const { data, error } = await supabase
          .from('seller_profiles')
          .select('id, verification_status')
          .eq('user_id', sellerId)
          .single();
          
        if (error) {
          console.error('Error fetching seller profile:', error);
          toast({
            title: "Error",
            description: "Could not fetch your seller profile",
            variant: "destructive"
          });
          return;
        }
        
        if (!data) {
          console.log('No seller profile found for this user');
          return;
        }
        
        console.log('Found seller profile:', data);
        setSellerProfile(data);
        
        // Now fetch meals
        fetchMeals(data.id);
      } catch (error) {
        console.error('Error in fetchSellerProfile:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };
    
    const fetchMeals = async (profileId: string) => {
      try {
        console.log('Fetching meals for seller profile ID:', profileId);
        
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('seller_id', profileId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching meals:', error);
          toast({
            title: "Error",
            description: "Failed to load your meals",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        console.log('Fetched meals:', data);
        setMeals(data as Meal[]);
      } catch (error) {
        console.error('Error in fetchMeals:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerProfile();
  }, [sellerId, toast]);

  const handleDelete = async (mealId: string) => {
    try {
      setDeleting(prev => ({ ...prev, [mealId]: true }));
      
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);
        
      if (error) {
        throw error;
      }
      
      setMeals(meals.filter(meal => meal.id !== mealId));
      
      toast({
        title: "Meal deleted",
        description: "Your meal has been deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal",
        variant: "destructive"
      });
    } finally {
      setDeleting(prev => ({ ...prev, [mealId]: false }));
    }
  };

  const isVerified = sellerProfile?.verification_status === 'approved';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading meals...</span>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-yellow-100 p-4 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-medium">Verification Required</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Your seller account needs to be verified before you can manage meals.
          </p>
          <Link to="/seller/verification">
            <SpiceButton variant="primary">
              Complete Verification
            </SpiceButton>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {meals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Loader2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No meals found</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              You haven't added any meals to your menu yet.
            </p>
            <Link to="/seller/add-meal">
              <SpiceButton variant="primary">
                Add Your First Meal
              </SpiceButton>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <Card key={meal.id} className="overflow-hidden">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {meal.images && meal.images.length > 0 ? (
                  <img 
                    src={meal.images[0]}
                    alt={meal.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/30">
                    <p className="text-muted-foreground">No image</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Link to={`/meals/${meal.id}`}>
                    <SpiceButton size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </SpiceButton>
                  </Link>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{meal.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                      {meal.description || "No description provided"}
                    </p>
                    <div className="mt-2">
                      <span className="font-medium">₹{meal.price_single}</span>
                      {meal.is_active ? (
                        <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                      ) : (
                        <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex mt-4 gap-2">
                  <Link to={`/seller/edit-meal/${meal.id}`} className="flex-1">
                    <SpiceButton variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </SpiceButton>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <SpiceButton 
                        variant="secondary" 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        disabled={deleting[meal.id]}
                      >
                        {deleting[meal.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </SpiceButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this meal. This action cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(meal.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerMealsTab;
