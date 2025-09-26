import React from 'react';
import { FactorySuggestion } from '../../types/portfolio';
import { MapPin, Star, TrendingUp } from 'lucide-react';

interface SuggestionsProps {
  data: FactorySuggestion[];
  loading: boolean;
  region: string;
}

export function Suggestions({ data, loading, region }: SuggestionsProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Factory Suggestions</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Factory Suggestions</h3>
        <div className="text-center py-4">
          <p className="text-muted-foreground">No suggestions available for {region}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-foreground">Factory Suggestions</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          You're strongest in <span className="font-medium text-emerald-600">{region}</span>. 
          Consider these factories to optimize your production:
        </p>
      </div>

      <div className="space-y-4">
        {data.map((suggestion, index) => (
          <div key={suggestion.factoryId} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">
                  {suggestion.name}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{suggestion.country}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {suggestion.region}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-foreground">
                  {(suggestion.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {suggestion.rationale}
            </p>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Recommended</span>
              </div>
              <button className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">
                Learn More →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Pro tip:</strong> These suggestions are based on your current portfolio performance 
          and regional strengths. Consider diversifying your supplier base to reduce risk.
        </p>
      </div>
    </div>
  );
}
