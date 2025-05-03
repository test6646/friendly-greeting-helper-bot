
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface RoleFeature {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

interface RoleInfoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: RoleFeature[];
  testimonial?: string;
  colorScheme: 'primary' | 'secondary' | 'destructive';
}

const RoleInfoCard: React.FC<RoleInfoCardProps> = ({
  title,
  description,
  icon,
  features,
  testimonial,
  colorScheme = 'primary'
}) => {
  const getColorClass = (type: string) => {
    switch (colorScheme) {
      case 'primary':
        return type === 'bg' ? 'bg-primary/10' : 'text-primary';
      case 'secondary':
        return type === 'bg' ? 'bg-secondary/10' : 'text-secondary';
      case 'destructive':
        return type === 'bg' ? 'bg-destructive/10' : 'text-destructive';
      default:
        return type === 'bg' ? 'bg-primary/10' : 'text-primary';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className={`bg-background/80 backdrop-blur-sm shadow-md rounded-2xl p-6 border-2 ${getColorClass('border')}/20`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center mb-4">
        <div className={`p-2.5 rounded-full mr-3 ${getColorClass('bg')}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-foreground/70">{description}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            className="flex items-start space-x-3"
            variants={itemVariants}
          >
            <div className={`p-1.5 rounded-full ${getColorClass('bg')}`}>
              {feature.icon || <CheckCircle className={`h-4 w-4 ${getColorClass('text')}`} />}
            </div>
            <div>
              <h4 className="text-base font-semibold">{feature.title}</h4>
              <p className="text-xs text-foreground/70">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {testimonial && (
        <motion.div 
          className={`mt-4 p-3 rounded-lg ${getColorClass('bg')}/30`}
          variants={itemVariants}
        >
          <p className="italic text-xs">
            {testimonial}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoleInfoCard;
