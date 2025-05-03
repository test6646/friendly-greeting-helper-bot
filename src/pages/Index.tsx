
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useFeaturedMeals } from '@/services/mealService';
import { toast } from "sonner";
import { AspectRatio } from '@/components/ui/aspect-ratio';

const Index = () => {
  const { data: featuredMeals, isLoading: mealsLoading, error: mealsError } = useFeaturedMeals();
  
  // Show error toast if meals fail to load
  React.useEffect(() => {
    if (mealsError) {
      console.error('Error loading featured meals:', mealsError);
      toast.error('Failed to load featured meals. Please try again later.');
    }
  }, [mealsError]);
  
  const heroVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <motion.section 
        className="relative bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden py-12 md:py-20 lg:py-28"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <motion.div variants={itemVariants}>
                <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none">
                  Women Empowerment Through Food
                </Badge>
              </motion.div>
              <motion.h1 
                variants={itemVariants}
                className="text-balance font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                Homemade Tiffin <br className="hidden sm:block" />
                <span className="text-gray-800">By Women, For Everyone</span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0"
              >
                Empowering women entrepreneurs while delivering authentic, home-cooked meals straight to your doorstep.
              </motion.p>
              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/meals">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                    Explore Meals
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                    How It Works
                  </Button>
                </Link>
              </motion.div>
            </div>
            <motion.div 
              variants={itemVariants}
              className="hidden md:block relative"
            >
              <div className="relative max-w-md mx-auto lg:mx-0 lg:ml-auto">
                <AspectRatio ratio={1/1} className="rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src="/placeholder.svg" 
                    alt="Woman cooking homemade food" 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">100% Verified Chefs</p>
                      <p className="text-xs text-gray-500">Skilled women home chefs</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Financial Empowerment</p>
                      <p className="text-xs text-gray-500">Supporting women entrepreneurs</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Featured Meals */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">
              Featured
            </Badge>
            <h2 className="section-title">Popular Meals</h2>
            <p className="section-subtitle">
              Discover our most loved homemade dishes prepared with love and care by our talented women chefs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {mealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-video mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : featuredMeals && featuredMeals.length > 0 ? (
              featuredMeals.slice(0, 4).map((meal) => (
                <Link to={`/meals/${meal.id}`} key={meal.id} className="block h-full">
                  <motion.div 
                    className="group rounded-lg overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative">
                      <AspectRatio ratio={4/3} className="overflow-hidden">
                        <img 
                          src={meal.images?.[0] || '/placeholder.svg'} 
                          alt={meal.name} 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </AspectRatio>
                      {meal.discount_percent > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          {meal.discount_percent}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold line-clamp-1">{meal.name}</h3>
                        <div className="flex items-center bg-yellow-100 px-1.5 py-0.5 rounded text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                          </svg>
                          <span className="font-medium">{meal.rating}</span>
                          <span className="text-gray-500 ml-1">({meal.rating_count})</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{meal.description}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <div>
                          <span className="font-bold">₹{Math.round(meal.price_single * (1 - meal.discount_percent/100))}</span>
                          {meal.discount_percent > 0 && (
                            <span className="text-gray-400 text-sm line-through ml-1">₹{meal.price_single}</span>
                          )}
                        </div>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                          {meal.cuisine_type || 'Homemade'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 py-8 text-center">
                <p className="text-gray-500">No featured meals available at the moment.</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-8 md:mt-12">
            <Link to="/meals">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Meals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 md:py-16 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">
              Simple Steps
            </Badge>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Our platform makes it easy to order homemade food from verified women chefs in your area.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: "Find Your Chef",
                description: "Browse through our verified home chefs in your area and explore their menu offerings."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Place Your Order",
                description: "Choose your meals and place an order for one-time delivery or subscribe for regular meals."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: "Enjoy & Support",
                description: "Receive freshly made meals and support women entrepreneurs in your community."
              }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center h-full"
                whileHover={{ y: -5 }}
              >
                <div className="bg-primary/10 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8 md:mt-12">
            <Link to="/how-it-works">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Meet Our Chefs */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">
              Featured
            </Badge>
            <h2 className="section-title">Meet Our Chefs</h2>
            <p className="section-subtitle">
              Get to know our talented women chefs who are passionate about sharing their culinary expertise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Only render if real data is available from a Supabase call */}
            {/* Dynamic top sellers will be fetched from seller_profiles table in Supabase */}
            <div className="col-span-full py-6 text-center">
              <p className="text-gray-500 italic">Popular chef profiles will appear here once data is fetched from the database.</p>
              <Link to="/sellers" className="inline-block mt-4">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  View All Chefs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 md:py-16 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">
              Testimonials
            </Badge>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Hear from our satisfied customers who love the authentic taste of homemade food.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Display real testimonials if available, otherwise a message will display */}
            <div className="col-span-full py-6 text-center">
              <p className="text-gray-500 italic">Customer testimonials will appear here once they are added to the database.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-10 md:py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Join SheKaTiffin Today</h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-6 md:mb-8">
              Discover authentic homemade meals or start your journey as a seller and turn your culinary passion into a business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto">
                  Sign Up as Customer
                </Button>
              </Link>
              <Link to="/auth?tab=signup&role=seller">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
