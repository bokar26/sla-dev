import React from 'react';
import { motion } from 'framer-motion';

interface AvatarStackProps {
  avatars: Array<{
    id: string;
    name: string;
    src?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarStack({ 
  avatars, 
  max = 3, 
  size = 'md',
  className = "" 
}: AvatarStackProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={avatar.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`
            ${sizeClasses[size]}
            rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600
            flex items-center justify-center text-white font-medium
            border-2 border-white dark:border-neutral-900
            ${index > 0 ? '-ml-2' : ''}
            shadow-sm
          `}
          title={avatar.name}
        >
          {avatar.src ? (
            <img 
              src={avatar.src} 
              alt={avatar.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>
              {avatar.fallback || avatar.name.charAt(0).toUpperCase()}
            </span>
          )}
        </motion.div>
      ))}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: visibleAvatars.length * 0.1 }}
          className={`
            ${sizeClasses[size]}
            rounded-full bg-muted
            flex items-center justify-center text-muted-foreground font-medium
            border-2 border-white dark:border-neutral-900 -ml-2
            shadow-sm
          `}
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}
