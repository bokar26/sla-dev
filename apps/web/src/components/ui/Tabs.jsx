import React, { useState, createContext, useContext } from 'react';

const TabsContext = createContext();

const Tabs = ({ children, value, defaultValue, onValueChange, className = '' }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleChange = (next) => {
    if (typeof onValueChange === "function") {
      onValueChange(next);
    }
    if (value === undefined) {
      setInternalValue(next);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-border ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, className = '' }) => {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = value === activeValue;
  
  const handleClick = () => {
    if (typeof onValueChange === "function") {
      onValueChange(value);
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
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

const TabsContent = ({ value, children, className = '' }) => {
  const { value: activeValue } = useContext(TabsContext);
  if (value !== activeValue) return null;
  
  return (
    <div className={`tabs-content ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
