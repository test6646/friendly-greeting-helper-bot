
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

const SellersPage = () => {
  const { data: sellers, isLoading } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select(`
          id,
          user_id,
          business_name,
          business_description,
          cover_image_url,
          cuisine_types,
          verification_status,
          rating,
          rating_count
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Layout>
      <div className="py-8 px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Talented Home Cooks</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the passionate culinary artists behind our delicious meals, each bringing their unique 
            cultural heritage and cooking expertise to your table.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SellerCardSkeleton key={index} />
            ))}
          </div>
        ) : sellers && sellers.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {sellers.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No cooks available at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

const SellerCard = ({ seller }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <img 
            src={seller.cover_image_url || '/placeholder.svg'} 
            alt={seller.business_name}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        {seller.verification_status === 'verified' && (
          <div className="absolute top-2 right-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            Verified
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-xl mb-1">{seller.business_name}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {seller.cuisine_types ? (Array.isArray(seller.cuisine_types) ? seller.cuisine_types.join(', ') : seller.cuisine_types) : 'Various cuisines'}
        </p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
            <span className="ml-1 text-sm font-medium">
              {seller.rating ? seller.rating.toFixed(1) : 'New'} 
              {seller.rating_count > 0 && <span className="text-xs text-muted-foreground ml-1">({seller.rating_count})</span>}
            </span>
          </div>
        </div>
        
        <p className="text-sm line-clamp-2 mb-4">{seller.business_description || "This home cook hasn't added a description yet."}</p>
        
        <Link to={`/sellers/${seller.id}`}>
          <Button className="w-full">View Meals</Button>
        </Link>
      </div>
    </motion.div>
  );
};

const SellerCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <AspectRatio ratio={16/9}>
      <Skeleton className="w-full h-full" />
    </AspectRatio>
    <div className="p-5">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-4 w-1/4 mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default SellersPage;
