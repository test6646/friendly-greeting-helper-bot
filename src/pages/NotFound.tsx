
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/20 py-12 px-4">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <motion.div 
              className="text-9xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 10,
                delay: 0.2
              }}
            >
              404
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-primary hover:bg-primary/90">
                  Return to Home
                </Button>
              </Link>
              <Link to="/meals">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Browse Meals
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-2">Looking for something specific?</h2>
            <p className="text-gray-600 text-sm mb-4">
              Here are some popular pages that might help you find what you're looking for:
            </p>
            <div className="space-y-2 text-left">
              <Link to="/" className="block text-primary hover:underline">• Home</Link>
              <Link to="/meals" className="block text-primary hover:underline">• Browse Meals</Link>
              <Link to="/sellers" className="block text-primary hover:underline">• Meet Our Cooks</Link>
              <Link to="/how-it-works" className="block text-primary hover:underline">• How It Works</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFound;
