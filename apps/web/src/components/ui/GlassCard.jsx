import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = '', 
  hover = true, 
  ...props 
}) => {
  const baseClasses = "glass rounded-xl p-5 transition-all duration-200 ease-smooth";
  const hoverClasses = hover ? "hover:translate-y-[-1px] hover:shadow-deep" : "";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
