import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Image as ImageIcon, Search, CheckCircle } from 'lucide-react';

const ImageSearchProgress = ({ phase, progress = 0 }) => {
  const steps = [
    {
      id: 'analyzing',
      label: 'Analyzing image(s) with Mistral...',
      icon: ImageIcon,
      description: 'Extracting product attributes and materials'
    },
    {
      id: 'extracting',
      label: 'Extracting product attributes...',
      icon: Search,
      description: 'Identifying construction and manufacturing details'
    },
    {
      id: 'matching',
      label: 'Matching to factory capabilities...',
      icon: Search,
      description: 'Finding factories with compatible skills'
    },
    {
      id: 'ranking',
      label: 'Ranking suppliers...',
      icon: CheckCircle,
      description: 'Calculating best matches based on your requirements'
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === phase);
  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-6 p-8"
    >
      {/* Animated Icon */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center"
        >
          <Loader2 className="w-8 h-8 text-emerald-600" />
        </motion.div>
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-neutral-200 dark:text-neutral-700"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className="text-emerald-600"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Current Step */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {currentStep.label}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentStep.description}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrent 
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800'
                  : isCompleted
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'bg-neutral-50 dark:bg-neutral-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Percentage */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>
    </motion.div>
  );
};

export default ImageSearchProgress;
