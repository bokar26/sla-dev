import React from 'react';
import { Star, Clock, DollarSign, Shield, Leaf, Truck, Ship, Plane, Info } from 'lucide-react';

const RouteResults = ({ results, onClose }) => {
  if (!results || !results.routes || results.routes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-slate-500 dark:text-slate-400 mb-4">No routes found</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    );
  }

  const formatCurrency = (amount) => `$${amount.toLocaleString()}`;
  const formatReliability = (reliability) => `${Math.round(reliability * 100)}%`;
  const formatEmissions = (emissions) => `${emissions.toFixed(1)} kg CO₂e`;

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'air': return Plane;
      case 'sea': return Ship;
      case 'truck': return Truck;
      default: return Truck;
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'air': return 'text-blue-600 dark:text-blue-400';
      case 'sea': return 'text-cyan-600 dark:text-cyan-400';
      case 'truck': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const topRoute = results.routes[0];
  const otherRoutes = results.routes.slice(1);

  return (
    <div className="space-y-6">
      {/* Top Recommendation */}
      <div className="relative">
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            Top Pick
          </div>
        </div>
        
        <div className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {React.createElement(getModeIcon(topRoute.mode), { 
                className: `w-6 h-6 ${getModeColor(topRoute.mode)}` 
              })}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {topRoute.carrier}
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {topRoute.mode.toUpperCase()} • {topRoute.incoterms}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(topRoute.costUsd)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {topRoute.etaDays} days
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">ETA:</span>
              <span className="text-sm font-medium">{topRoute.etaDays} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Reliability:</span>
              <span className="text-sm font-medium">{formatReliability(topRoute.reliability)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Emissions:</span>
              <span className="text-sm font-medium">{formatEmissions(topRoute.emissionsKgCo2e)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Score:</span>
              <span className="text-sm font-medium">{Math.round(topRoute.score * 100)}%</span>
            </div>
          </div>

          {topRoute.legs && topRoute.legs.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Route:</div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                {topRoute.legs.map((leg, index) => (
                  <React.Fragment key={index}>
                    <span>{leg.from}</span>
                    <span>→</span>
                    {index === topRoute.legs.length - 1 && <span>{leg.to}</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {topRoute.notes && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">{topRoute.notes}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Options */}
      {otherRoutes.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Other Options</h4>
          <div className="space-y-3">
            {otherRoutes.map((route) => (
              <div
                key={route.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(getModeIcon(route.mode), { 
                      className: `w-5 h-5 ${getModeColor(route.mode)}` 
                    })}
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {route.carrier}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {route.mode.toUpperCase()} • {route.incoterms}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(route.costUsd)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {route.etaDays} days
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Reliability:</span>
                    <span className="font-medium">{formatReliability(route.reliability)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Leaf className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Emissions:</span>
                    <span className="font-medium">{formatEmissions(route.emissionsKgCo2e)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Score:</span>
                    <span className="font-medium">{Math.round(route.score * 100)}%</span>
                  </div>
                  <div className="text-right">
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanations */}
      {results.explanations && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Why this recommendation?
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {results.explanations.whyTopPick}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            Scoring weights: Cost {Math.round(results.explanations.scoringWeights.cost * 100)}%, 
            ETA {Math.round(results.explanations.scoringWeights.eta * 100)}%, 
            Reliability {Math.round(results.explanations.scoringWeights.reliability * 100)}%, 
            Emissions {Math.round(results.explanations.scoringWeights.emissions * 100)}%
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Close
        </button>
        <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Create Booking
        </button>
      </div>
    </div>
  );
};

export default RouteResults;
