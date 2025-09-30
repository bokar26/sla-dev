import React from 'react';
import CompactProgressBar from '../ui/CompactProgressBar';

type SavingsMiniCardProps = {
  title: string;                    // "TIME SAVINGS" | "COST SAVINGS"
  savedLabel: string;               // e.g., "Saved: 12h" or "Saved: $39,750.00"
  rightLabelKey: string;            // "Total time spent:" | "Total spend:" (compact or omitted)
  rightLabelValue?: string;         // value to show at right, optional in mini
  rightCalloutKey: string;          // "Without SLA:"
  rightCalloutValue: string;        // e.g., "36h" or "$304,750.00"
  progress: number;                 // 0..1 fill percentage
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export default function SavingsMiniCard({
  title,
  savedLabel,
  rightLabelKey,
  rightLabelValue,
  rightCalloutKey,
  rightCalloutValue,
  progress,
  loading = false,
  error = null,
  className = ""
}: SavingsMiniCardProps) {
  if (loading) {
    return (
      <div className={`rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 p-3 shadow-sm ${className}`}>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 p-3 shadow-sm ${className}`}>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {title}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Couldn't load savings
        </div>
      </div>
    );
  }

  // Convert progress to percentage for CompactProgressBar
  const progressPercent = Math.round(progress * 100);
  
  // Determine format function based on title
  const format = title.includes('TIME') 
    ? (val: number) => {
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h}h`;
        return `${m}m`;
      }
    : (val: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(val);

  // Calculate values for CompactProgressBar
  const savedValue = title.includes('TIME') 
    ? (parseFloat(savedLabel.replace('Saved: ', '').replace('h', '')) * 60) // Convert hours to minutes
    : (parseFloat(savedLabel.replace('Saved: $', '').replace(',', '')) * 100); // Convert dollars to cents

  const baselineValue = title.includes('TIME')
    ? (parseFloat(rightCalloutValue.replace('h', '')) * 60) // Convert hours to minutes
    : (parseFloat(rightCalloutValue.replace('$', '').replace(',', '')) * 100); // Convert dollars to cents

  return (
    <div className={`rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 p-3 shadow-sm ${className}`}>
      <CompactProgressBar
        label={title}
        saved={savedValue}
        baseline={baselineValue}
        format={format}
        color="emerald"
        totalLabel={rightLabelKey.replace(':', '')}
        ariaLabel={`${title} - ${savedLabel}, ${rightCalloutKey} ${rightCalloutValue}`}
      />
    </div>
  );
}
