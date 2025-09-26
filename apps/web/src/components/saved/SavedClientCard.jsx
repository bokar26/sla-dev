import React from 'react';
import { ChevronRight, CheckSquare, Square, Mail, Phone, MapPin } from 'lucide-react';

export default function SavedClientCard({ client, onOpen, selectable=false, selected=false, onToggleSelect }) {
  return (
    <div className="relative">
      {selectable && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          className="absolute top-2 left-2 z-10 rounded p-1 bg-white/90 border"
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
        </button>
      )}

      <button
        type="button"
        onClick={() => !selectable && onOpen(client)}
        className={`w-full text-left rounded-2xl border border-neutral-200/60 bg-white ${selectable ? '' : 'hover:bg-neutral-50'} focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition-all p-4 group shadow-sm`}
        aria-label={`Open details for ${client.name}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                Client
              </span>
              {client.orders?.length > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700">
                  {client.orders.length} orders
                </span>
              )}
            </div>
            
            <h3 className="text-sm font-medium text-neutral-900 truncate mb-1">{client.name}</h3>
            
            {client.primaryContact && (
              <p className="text-xs text-neutral-600 truncate mb-1">{client.primaryContact}</p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              {client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="size-3" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="size-3" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
            
            {client.addresses?.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                <MapPin className="size-3" />
                <span>{client.addresses[0].city}, {client.addresses[0].country}</span>
              </div>
            )}
            
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
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
            )}
          </div>
          
          {!selectable && <ChevronRight className="size-4 text-neutral-400 group-hover:text-neutral-600 shrink-0" />}
        </div>
      </button>
    </div>
  );
}
