import React from 'react';

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="/images/factory-background.png"
          alt="Factory Background"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default BackgroundPattern;
