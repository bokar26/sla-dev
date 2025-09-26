import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

export default function SavedTable({ data, onOpen, selectable=false, selectedIds=new Set(), onToggleSelect=()=>{} }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      <table className="min-w-full text-sm text-slate-900 dark:text-slate-100">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
          <tr>
            {selectable && <th className="w-10 px-3 py-2"></th>}
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Type</th>
            <th className="px-4 py-2 text-left font-medium">Region</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr
              key={e.id}
              className={`${!selectable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''} focus-within:bg-slate-50 dark:focus-within:bg-slate-800/40`}
              onClick={() => !selectable && onOpen(e)}
              tabIndex={0}
              role={!selectable ? 'button' : undefined}
              aria-label={`Open details for ${e.name}`}
            >
              {selectable && (
                <td className="px-3 py-3">
                  <button
                    className="rounded border px-1 py-0.5"
                    onClick={(ev) => { ev.stopPropagation(); onToggleSelect(e.id); }}
                    aria-label={selectedIds.has(e.id) ? 'Deselect' : 'Select'}
                  >
                    {selectedIds.has(e.id) ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                  </button>
                </td>
              )}
              <td className="px-4 py-3 text-neutral-900">{e.name}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-100 text-neutral-700 uppercase tracking-wide">
                  {e.type === 'supplier' ? 'Supplier' : 'Factory'}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">{e.region || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
