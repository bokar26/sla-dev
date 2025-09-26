import React from 'react';

const Tabs = ({ children, className = '' }) => {
  return (
    <div className={`tabs ${className}`}>
      {children}
    </div>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-border ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, activeValue, onValueChange, children, className = '' }) => {
  const isActive = value === activeValue;
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neutral-300'
      } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeValue, children, className = '' }) => {
  if (value !== activeValue) return null;
  
  return (
    <div className={`tabs-content ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
