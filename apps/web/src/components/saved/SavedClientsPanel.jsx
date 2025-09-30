import React, { useMemo, useState } from 'react';
import { Search, List, Grid3X3, Users, Download, CheckSquare, Square, SlidersHorizontal } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import SavedClientCard from './SavedClientCard';
import SavedClientTable from './SavedClientTable';
import SavedClientDetails from './SavedClientDetails';
import ExportClientsModal from './ExportClientsModal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function SavedClientsPanel() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'table'
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  
  // Selection and export state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [exportOpen, setExportOpen] = useState(false);

  // Fetch clients with search
  const { clients, loading, error } = useClients({ search: query });

  // Filter clients based on search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(client => {
      const basicHay = [
        client.name, client.email, client.phone, client.primaryContact,
        client.tags?.join(','), client.website,
        client.addresses?.map(addr => `${addr.city} ${addr.country}`).join(' '),
        client.vendorsUsed?.join(',')
      ].join(' ').toLowerCase();

      return basicHay.includes(q);
    });
  }, [clients, query]);

  // Selection helpers
  const isSelected = (id) => selectedIds.has(id);
  const toggleOne = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllFiltered = () => setSelectedIds(new Set(filtered.map(c => c.id)));

  if (error) return <div className="p-4 text-red-600">Failed to load clients: {error}</div>;

  const onOpen = (entity) => { setSelected(entity); setOpen(true); };

  return (
    <div className="space-y-4">
      {/* Search and View Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`px-2 py-1 text-xs rounded border ${selectMode ? 'bg-neutral-900 text-white' : ''}`}
            onClick={() => { setSelectMode(v => !v); if (selectMode) clearSelection(); }}
            title="Toggle select mode"
          >
            {selectMode ? 'Done' : 'Select'}
          </button>

          {selectMode && (
            <>
              <button className="px-2 py-1 text-xs rounded border" onClick={selectAllFiltered}>
                Select All (filtered)
              </button>
              <button className="px-2 py-1 text-xs rounded border" onClick={clearSelection}>
                Clear
              </button>
              <button
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-neutral-900 text-white disabled:opacity-50"
                onClick={() => setExportOpen(true)}
                disabled={selectedIds.size === 0}
                title="Export selected"
              >
                <Download className="size-3.5" /> Export
              </button>
            </>
          )}

          <div className="flex items-center gap-1">
            <button
              className={`px-2 py-1 text-xs rounded ${view==='cards' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}
              onClick={() => setView('cards')}
            >Cards</button>
            <button
              className={`px-2 py-1 text-xs rounded ${view==='table' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}
              onClick={() => setView('table')}
            >Table</button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filtered.length} client${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border bg-neutral-50 animate-pulse" />
          ))}
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((client) => (
            <SavedClientCard
              key={client.id}
              client={client}
              onOpen={onOpen}
              selectable={selectMode}
              selected={isSelected(client.id)}
              onToggleSelect={() => toggleOne(client.id)}
            />
          ))}
        </div>
      ) : (
        <SavedClientTable
          data={filtered}
          onOpen={onOpen}
          selectable={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleOne}
        />
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
          <p className="text-muted-foreground mb-4">
            {query ? "Try adjusting your search" : "No saved clients available"}
          </p>
          {!query && (
            <button
              onClick={() => {
                // Trigger upload modal from parent
                const event = new CustomEvent('openUploadModal');
                window.dispatchEvent(event);
              }}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Upload clients
            </button>
          )}
        </div>
      )}

      <SavedClientDetails open={open} onOpenChange={setOpen} client={selected} />
      
      {/* Export Modal */}
      {exportOpen && (
        <ExportClientsModal
          onClose={() => setExportOpen(false)}
          clients={filtered.filter(c => selectedIds.has(c.id))}
        />
      )}
    </div>
  );
}
