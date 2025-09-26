import React from 'react';
import { CheckSquare, Square, Mail, Phone, MapPin, Package, Building2 } from 'lucide-react';

export default function SavedClientTable({ data, onOpen, selectable=false, selectedIds=new Set(), onToggleSelect=()=>{} }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      <table className="min-w-full text-sm text-slate-900 dark:text-slate-100">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
          <tr>
            {selectable && <th className="w-10 px-3 py-2"></th>}
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Contact</th>
            <th className="px-4 py-2 text-left font-medium">Location</th>
            <th className="px-4 py-2 text-left font-medium">Orders</th>
            <th className="px-4 py-2 text-left font-medium">Vendors</th>
            <th className="px-4 py-2 text-left font-medium">Tags</th>
          </tr>
        </thead>
        <tbody>
          {data.map((client) => (
            <tr
              key={client.id}
              className={`${!selectable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''} focus-within:bg-slate-50 dark:focus-within:bg-slate-800/40`}
              onClick={() => !selectable && onOpen(client)}
              tabIndex={0}
              role={!selectable ? 'button' : undefined}
              aria-label={`Open details for ${client.name}`}
            >
              {selectable && (
                <td className="px-3 py-3">
                  <button
                    className="rounded border px-1 py-0.5"
                    onClick={(ev) => { ev.stopPropagation(); onToggleSelect(client.id); }}
                    aria-label={selectedIds.has(client.id) ? 'Deselect' : 'Select'}
                  >
                    {selectedIds.has(client.id) ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                  </button>
                </td>
              )}
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium text-neutral-900">{client.name}</div>
                  {client.primaryContact && (
                    <div className="text-xs text-neutral-500">{client.primaryContact}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-1 text-xs text-neutral-600">
                      <Mail className="size-3" />
                      <span className="truncate max-w-32">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1 text-xs text-neutral-600">
                      <Phone className="size-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {client.addresses?.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-neutral-600">
                    <MapPin className="size-3" />
                    <span>{client.addresses[0].city}, {client.addresses[0].country}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-neutral-600">
                  <Package className="size-3" />
                  <span>{client.orders?.length || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-neutral-600">
                  <Building2 className="size-3" />
                  <span>{client.vendorsUsed?.length || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {client.tags && client.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {client.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-100 text-neutral-600">
                        {tag}
                      </span>
                    ))}
                    {client.tags.length > 2 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-100 text-neutral-600">
                        +{client.tags.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
