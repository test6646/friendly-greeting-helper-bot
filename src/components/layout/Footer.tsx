
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <motion.footer 
      className="bg-white pt-10 pb-6 border-t"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <motion.div className="col-span-1 md:col-span-1" variants={itemVariants}>
            <Link to="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                SheKaTiffin
              </span>
            </Link>
            <p className="text-sm text-gray-600 mb-4">
              Empowering women entrepreneurs through homemade food delivery services.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </motion.div>

          {/* Links */}
          <motion.div className="col-span-1" variants={itemVariants}>
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 hover:text-primary text-sm transition-colors">Home</Link></li>
              <li><Link to="/meals" className="text-gray-600 hover:text-primary text-sm transition-colors">Meals</Link></li>
              <li><Link to="/sellers" className="text-gray-600 hover:text-primary text-sm transition-colors">Sellers</Link></li>
              <li><Link to="/how-it-works" className="text-gray-600 hover:text-primary text-sm transition-colors">How It Works</Link></li>
            </ul>
          </motion.div>

          <motion.div className="col-span-1" variants={itemVariants}>
            <h3 className="font-semibold text-gray-800 mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-gray-600 hover:text-primary text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-primary text-sm transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-600 hover:text-primary text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-primary text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </motion.div>

          <motion.div className="col-span-1" variants={itemVariants}>
            <h3 className="font-semibold text-gray-800 mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600 text-sm">
                <Mail size={16} className="mr-2 text-primary" />
                <span>support@shekatiffin.com</span>
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <Phone size={16} className="mr-2 text-primary" />
                <span>+91 9876543210</span>
              </li>
              <li className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium mb-2">Subscribe to our newsletter</span>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="bg-gray-50 border border-gray-200 rounded-l-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button className="bg-primary text-white rounded-r-md px-3 py-2 text-sm">
                      Subscribe
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-sm text-gray-600 text-center">
            &copy; {new Date().getFullYear()} SheKaTiffin. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
