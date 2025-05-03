
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  X, 
  Star, 
  Clock, 
  DollarSign,
  MapPin,
  TrendingUp,
  History,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { searchMeals, Meal, useCuisineTypes, useCategories } from '@/services/mealService';
import { formatCurrency } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

// Define Filter interfaces
interface Filters {
  query: string;
  priceRange: [number, number];
  cuisineTypes: string[];
  categories: string[];
  dietaryPreferences: string[];
  rating: number;
  sortBy: string;
}

const MAX_RECENT_SEARCHES = 5;
const MAX_POPULAR_SEARCHES = 5;

const dietaryOptions = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'dairy_free', label: 'Dairy Free' },
  { id: 'nut_free', label: 'Nut Free' }
];

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: availableCuisineTypes } = useCuisineTypes();
  const { data: availableCategories } = useCategories();
  
  // Get query param from URL
  const queryParams = new URLSearchParams(location.search);
  const queryFromUrl = queryParams.get('q') || '';
  
  const [query, setQuery] = useState(queryFromUrl);
  const [searchResults, setSearchResults] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState<string[]>([
    'Butter Chicken', 'Vegan Meals', 'Breakfast', 'Quick Delivery', 'Pizza'
  ]);
  
  const [filters, setFilters] = useState<Filters>({
    query: queryFromUrl,
    priceRange: [0, 1000],
    cuisineTypes: [],
    categories: [],
    dietaryPreferences: [],
    rating: 0,
    sortBy: 'relevance'
  });
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!query.trim() && filters.cuisineTypes.length === 0 && 
        filters.categories.length === 0 && filters.dietaryPreferences.length === 0) {
      toast({
        description: "Please enter a search term or select filters",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Update URL query params
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
      
      // Save to recent searches
      saveRecentSearch(query);
      
      // Fetch search results
      const results = await searchMeals(query);
      
      // Apply filters
      const filteredResults = results.filter(meal => {
        // Filter by price range
        const price = meal.price_single || 0;
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }
        
        // Filter by cuisine type
        if (filters.cuisineTypes.length > 0 && meal.cuisine_type && 
            !filters.cuisineTypes.includes(meal.cuisine_type)) {
          return false;
        }
        
        // Filter by category
        if (filters.categories.length > 0 && meal.category && 
            !filters.categories.includes(meal.category)) {
          return false;
        }
        
        // Filter by rating
        if (meal.rating < filters.rating) {
          return false;
        }
        
        // Dietary preferences (would need to be implemented in the meal data)
        // This is a basic implementation assuming dietary_info is a JSON object
        if (filters.dietaryPreferences.length > 0 && meal.dietary_info) {
          const dietInfo = meal.dietary_info as any;
          const hasDietaryMatch = filters.dietaryPreferences.some(
            pref => dietInfo[pref] === true
          );
          if (!hasDietaryMatch) return false;
        }
        
        return true;
      });
      
      // Sort results
      let sortedResults = [...filteredResults];
      
      switch (filters.sortBy) {
        case 'price_asc':
          sortedResults.sort((a, b) => (a.price_single || 0) - (b.price_single || 0));
          break;
        case 'price_desc':
          sortedResults.sort((a, b) => (b.price_single || 0) - (a.price_single || 0));
          break;
        case 'rating':
          sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        // Add other sort options as needed
      }
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch search results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: query,
      priceRange: [0, 1000],
      cuisineTypes: [],
      categories: [],
      dietaryPreferences: [],
      rating: 0,
      sortBy: 'relevance'
    });
  };
  
  // Apply filters from sheet
  const applyFilters = () => {
    setIsFilterOpen(false);
    handleSearch();
  };
  
  // Run search on initial load if query exists
  useEffect(() => {
    if (queryFromUrl) {
      handleSearch();
    }
  }, []);
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Find Your Perfect Meal</h1>
          
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for meals, cuisines, or sellers..."
                className="pl-9 h-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              {query && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SearchIcon className="h-4 w-4 mr-2" />}
                Search
              </Button>
              
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Refine Search Results</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-2">Price Range</h3>
                      <div className="space-y-5">
                        <Slider
                          value={filters.priceRange}
                          min={0}
                          max={1000}
                          step={10}
                          onValueChange={(value) => handleFilterChange('priceRange', value)}
                          className="py-4"
                        />
                        <div className="flex items-center justify-between">
                          <p>₹{filters.priceRange[0]}</p>
                          <p>₹{filters.priceRange[1]}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Cuisine Types */}
                    <div>
                      <h3 className="font-medium mb-2">Cuisine Types</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableCuisineTypes?.map((cuisine) => (
                          <div key={cuisine} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`cuisine-${cuisine}`}
                              checked={filters.cuisineTypes.includes(cuisine)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('cuisineTypes', [...filters.cuisineTypes, cuisine]);
                                } else {
                                  handleFilterChange('cuisineTypes', 
                                    filters.cuisineTypes.filter(t => t !== cuisine)
                                  );
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`cuisine-${cuisine}`}
                              className="text-sm"
                            >
                              {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Categories */}
                    <div>
                      <h3 className="font-medium mb-2">Categories</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableCategories?.map((category) => (
                          <div key={category} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('categories', [...filters.categories, category]);
                                } else {
                                  handleFilterChange('categories', 
                                    filters.categories.filter(c => c !== category)
                                  );
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`category-${category}`}
                              className="text-sm"
                            >
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Dietary Preferences */}
                    <div>
                      <h3 className="font-medium mb-2">Dietary Preferences</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {dietaryOptions.map(option => (
                          <div key={option.id} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`diet-${option.id}`}
                              checked={filters.dietaryPreferences.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('dietaryPreferences', [...filters.dietaryPreferences, option.id]);
                                } else {
                                  handleFilterChange('dietaryPreferences', 
                                    filters.dietaryPreferences.filter(d => d !== option.id)
                                  );
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`diet-${option.id}`}
                              className="text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Rating */}
                    <div>
                      <h3 className="font-medium mb-2">Minimum Rating</h3>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <Button
                            key={rating}
                            variant={filters.rating >= rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange('rating', rating)}
                            className="h-8 w-8 p-0"
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Sort By */}
                    <div>
                      <h3 className="font-medium mb-2">Sort By</h3>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <SheetFooter className="flex justify-between">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All
                    </Button>
                    <SheetClose asChild>
                      <Button onClick={applyFilters}>Apply Filters</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {/* Search Suggestions */}
        {!loading && searchResults.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center mb-3">
                    <History className="h-5 w-5 mr-2" />
                    <h2 className="text-lg font-medium">Recent Searches</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <Badge 
                        key={`recent-${index}`} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-white"
                        onClick={() => {
                          setQuery(term);
                          handleFilterChange('query', term);
                          handleSearch();
                        }}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Popular Searches */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  <h2 className="text-lg font-medium">Popular Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <Badge 
                      key={`popular-${index}`} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-white"
                      onClick={() => {
                        setQuery(term);
                        handleFilterChange('query', term);
                        handleSearch();
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Active Filters */}
        {(filters.cuisineTypes.length > 0 || 
          filters.categories.length > 0 || 
          filters.dietaryPreferences.length > 0 || 
          filters.rating > 0 || 
          filters.sortBy !== 'relevance') && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.cuisineTypes.map(cuisine => (
              <Badge key={`filter-cuisine-${cuisine}`} variant="secondary" className="flex items-center gap-1">
                {cuisine}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    handleFilterChange('cuisineTypes', 
                      filters.cuisineTypes.filter(c => c !== cuisine)
                    );
                    handleSearch();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {filters.categories.map(category => (
              <Badge key={`filter-category-${category}`} variant="secondary" className="flex items-center gap-1">
                {category}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    handleFilterChange('categories', 
                      filters.categories.filter(c => c !== category)
                    );
                    handleSearch();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {filters.dietaryPreferences.map(pref => (
              <Badge key={`filter-diet-${pref}`} variant="secondary" className="flex items-center gap-1">
                {dietaryOptions.find(opt => opt.id === pref)?.label || pref}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    handleFilterChange('dietaryPreferences', 
                      filters.dietaryPreferences.filter(p => p !== pref)
                    );
                    handleSearch();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {filters.rating > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {`${filters.rating}+ Stars`}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    handleFilterChange('rating', 0);
                    handleSearch();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filters.sortBy !== 'relevance' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.sortBy === 'price_asc' ? 'Price ↑' : 
                  filters.sortBy === 'price_desc' ? 'Price ↓' : 
                  filters.sortBy === 'rating' ? 'Top Rated' : filters.sortBy}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    handleFilterChange('sortBy', 'relevance');
                    handleSearch();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                clearFilters();
                handleSearch();
              }}
            >
              Clear all
            </Button>
          </div>
        )}
        
        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Searching for meals...</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">{searchResults.length} results found</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(meal => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/meals/${meal.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                      <div className="aspect-video relative overflow-hidden">
                        {meal.images && meal.images.length > 0 ? (
                          <img 
                            src={meal.images[0]} 
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">No image</p>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{meal.name}</h3>
                        </div>
                        
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {meal.description || "No description provided"}
                        </p>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="line-clamp-1">
                            {meal.seller_profiles?.business_name || "Unknown Seller"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{meal.rating || 0} ({meal.rating_count || 0})</span>
                          </div>
                          
                          <span className="font-bold text-primary">
                            {formatCurrency(meal.price_single || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        ) : query ? (
          <Alert variant="default" className="bg-muted/30">
            <AlertDescription className="py-8 flex flex-col items-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <SearchIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-1">No results found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We couldn't find any meals matching "{query}". 
                Try different keywords or adjust your filters.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </Layout>
  );
};

export default SearchPage;
