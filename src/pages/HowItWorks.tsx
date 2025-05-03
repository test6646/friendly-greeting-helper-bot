
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { ArrowRight, ShoppingBag, Clock, MapPin, ThumbsUp } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <ShoppingBag className="h-8 w-8 text-primary" />,
      title: "Browse & Choose Meals",
      description: "Explore our extensive range of authentic homemade dishes prepared by talented home cooks in your neighborhood."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Schedule Your Delivery",
      description: "Choose a convenient time for your meals to be delivered. Same-day delivery options are available for many locations."
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Track Your Order",
      description: "Watch as your order is prepared and delivered in real-time. Our captains ensure your food arrives fresh and on time."
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-primary" />,
      title: "Enjoy & Share Feedback",
      description: "Savor your authentic homemade meal and let us know how you liked it. Your ratings help our cooks improve."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6">How SheKaTiffin Works</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We connect food lovers with talented home cooks for authentic homemade meals delivered to your door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-background">
        <div className="container max-w-6xl">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm border border-border flex flex-col items-center text-center"
                variants={itemVariants}
              >
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/10">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose SheKaTiffin?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're more than just a food delivery service - we're building a community that celebrates home cooking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Authentic Home Cooking",
                description: "Enjoy meals made with love and authentic recipes passed down through generations."
              },
              {
                title: "Support Local Cooks",
                description: "Help talented home cooks in your community turn their passion into livelihood."
              },
              {
                title: "Fresh & On-Time",
                description: "Our dedicated captains ensure your food arrives fresh, hot and exactly when you need it."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
