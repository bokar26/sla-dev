import React from 'react';
import { motion } from 'framer-motion';

const SleekButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseClasses = "font-medium transition-all duration-200 ease-smooth focus:outline-none focus:ring-4";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft focus:ring-emerald-400/30",
    outline: "border border-border text-foreground hover:bg-muted focus:ring-ring/20",
    ghost: "text-muted-foreground hover:bg-muted focus:ring-ring/20",
    glass: "glass text-white hover:bg-white/10 focus:ring-white/20"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl"
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default SleekButton;
