import React from 'react';

export default function ResultsList({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <p>No results to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((factory, index) => (
        <div
          key={factory.id || index}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {factory.name || `Factory ${index + 1}`}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {factory.region && factory.country
                  ? `${factory.region}, ${factory.country}`
                  : factory.location || 'Location not specified'
                }
              </p>
              {factory.specialties && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.isArray(factory.specialties)
                    ? factory.specialties.slice(0, 3).map((specialty, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                          {specialty}
                        </span>
                      ))
                    : <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                        {factory.specialties}
                      </span>
                  }
                </div>
              )}
              {factory.score && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Match Score:</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-24">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(factory.score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {Math.round(factory.score * 100)}%
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4 flex flex-col gap-2">
              <button className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors">
                View Details
              </button>
              <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
