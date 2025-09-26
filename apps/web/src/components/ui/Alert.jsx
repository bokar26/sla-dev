import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({ 
  variant = 'default', 
  title, 
  children, 
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    destructive: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
  };

  const icons = {
    default: Info,
    destructive: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle
  };

  const Icon = icons[variant];

  return (
    <div 
      className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm break-words">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for more flexible usage
export const AlertTitle = ({ children, className = '' }) => (
  <h4 className={`font-medium mb-1 ${className}`}>{children}</h4>
);

export const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm break-words ${className}`}>{children}</div>
);

export default Alert;
