import React from 'react';
import { ChevronRight, CheckSquare, Square } from 'lucide-react';

export default function SavedCard({ entity, onOpen, selectable=false, selected=false, onToggleSelect }) {
  // entity: { id, type, name, region, matchScore? ... }
  return (
    <div className="relative">
      {selectable && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          className="absolute top-2 left-2 z-10 rounded p-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700"
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
        </button>
      )}

      <button
        type="button"
        onClick={() => !selectable && onOpen(entity)}
        className={`w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 ${selectable ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'} focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition-all p-4 group shadow-sm`}
        aria-label={`Open details for ${entity.name}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-100 text-neutral-700 uppercase tracking-wide">
                {entity.type === 'supplier' ? 'Supplier' : 'Factory'}
              </span>
              {typeof entity.matchScore === 'number' && (
                <span className="px-1.5 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700">
                  {Math.round(entity.matchScore)}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-sm font-medium text-neutral-900 truncate">{entity.name}</h3>
            {entity.region && (
              <p className="text-xs text-neutral-500 truncate">{entity.region}</p>
            )}
          </div>
          {!selectable && <ChevronRight className="size-4 text-neutral-400 group-hover:text-neutral-600 shrink-0" />}
        </div>
      </button>
    </div>
  );
}
