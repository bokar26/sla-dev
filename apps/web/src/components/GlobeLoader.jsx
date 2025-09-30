import React from 'react';
import WorldGlobe from './analytics/WorldGlobe';

/**
 * Animated globe loader component for search states
 * @param {number} size - Size of the globe in pixels (default: 280)
 * @param {string} subtitle - Optional subtitle text below the globe
 */
export default function GlobeLoader({ size = 280, subtitle = "Searching..." }) {
  // Mock data for the globe animation - just a few points to show rotation
  const mockData = [
    { lat: 20, lng: 78, name: "Searching...", status: "new" },
    { lat: 35, lng: 139, name: "Finding matches...", status: "new" },
    { lat: 40, lng: -74, name: "Analyzing...", status: "new" },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className="relative"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <WorldGlobe 
          data={mockData}
          cycleMs={1500}
          autoRotate={true}
          className="w-full h-full"
        />
      </div>
      {subtitle && (
        <p className="text-sm text-slate-600 font-medium animate-pulse">
          {subtitle}
        </p>
      )}
    </div>
  );
}
