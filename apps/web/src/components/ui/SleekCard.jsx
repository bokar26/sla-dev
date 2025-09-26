import React from 'react';
import { motion } from 'framer-motion';

const SleekCard = ({ 
  children, 
  className = '', 
  hover = true, 
  ...props 
}) => {
  const baseClasses = "rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900/60 transition-all duration-200 ease-smooth";
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

export default SleekCard;
