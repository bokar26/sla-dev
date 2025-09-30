import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SavedCard from './SavedCard';
import SavedTable from './SavedTable';
import SavedDetails from './SavedDetails';
import ExportVendorsModal from './ExportVendorsModal';
import UploadModal from './UploadModal';
import { useSavedVendors } from '../../stores/savedVendors';
import { listSavedVendors } from '../../services/savedVendorsService';
import { Search, List, Grid3X3, Building2, Download, CheckSquare, Square, SlidersHorizontal, Upload, FileText, FileImage } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function SavedVendorsPanel() {
  const { items, order, setAll } = useSavedVendors();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'table'
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  
  // Selection and export state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [exportOpen, setExportOpen] = useState(false);
  
  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('vendors');

  // Load saved vendors from API and populate store
  useEffect(() => {
    const loadSavedVendors = async () => {
      try {
        setLoading(true);
        const data = await listSavedVendors();
        setAll(data.vendors || []);
      } catch (e) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    loadSavedVendors();
  }, [setAll]);

  // Convert store data to array for filtering
  const vendors = useMemo(() => {
    return order.map(id => items[id]).filter(Boolean);
  }, [items, order]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(v => {
      // Basic vendor fields
      const basicHay = [
        v.name, v.region, v.vendor_type, v.country,
        v.contact?.name, v.contact?.email, v.contact?.phone, v.contact?.website,
        v.specialties?.join?.(',') ?? '',
        v.certifications?.join?.(',') ?? '',
      ].join(' ').toLowerCase();

      return basicHay.includes(q);
    });
  }, [vendors, query]);

  const onOpen = (entity) => {
    setSelected(entity);
    setOpen(true);
  };

  const isSelected = (id) => selectedIds.has(id);
  const toggleOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Upload handlers
  const handleUploadClick = (type) => {
    setUploadType(type);
    setUploadOpen(true);
  };

  const handleUploadSuccess = async (result) => {
    // Optimistically add new vendors to the store
    if (result.created && Array.isArray(result.created)) {
      const { addOrUpdate } = useSavedVendors.getState();
      result.created.forEach(vendor => addOrUpdate(vendor));
    }
    
    // Show success message
    const message = uploadType === 'vendors' 
      ? `Imported ${result.created?.length || 0} vendors${result.deduped ? ` (${result.deduped} deduped)` : ''}`
      : `Uploaded ${result.created?.length || 0} quotes`;
    
    // You could add a toast notification here
    console.log(message);
    
    // Background refetch to ensure consistency
    try {
      const data = await listSavedVendors();
      setAll(data.vendors || []);
    } catch (e) {
      console.error('Failed to refresh vendors:', e);
    }
  };

  const renderItem = (entity) => (
    <SavedCard
      key={entity.id}
      entity={entity}
      onOpen={onOpen}
      selectable={selectMode}
      selected={isSelected(entity.id)}
      onToggleSelect={() => toggleOne(entity.id)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Saved Vendors</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} vendor{filtered.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Upload Dropdown */}
          <div className="relative">
            <button
              onClick={() => handleUploadClick('vendors')}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
          
          <button
            onClick={() => setSelectMode(!selectMode)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          
          {selectMode && selectedIds.size > 0 && (
            <button
              onClick={() => setExportOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Export ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {view === 'cards' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
        </button>
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
          <AnimatePresence initial={false}>
            {filtered.map((e) => (
              <motion.div
                key={e.vendorId || e.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <SavedCard
                  key={e.vendorId || e.id}
                  entity={e}
                  onOpen={onOpen}
                  selectable={selectMode}
                  selected={isSelected(e.vendorId || e.id)}
                  onToggleSelect={() => toggleOne(e.vendorId || e.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <SavedTable
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
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No vendors found</h3>
          <p className="text-muted-foreground">
            {query ? "Try adjusting your search" : "No saved vendors available"}
          </p>
        </div>
      )}

      <SavedDetails open={open} onOpenChange={setOpen} entity={selected} />
      
      {/* Export Modal */}
      {exportOpen && (
        <ExportVendorsModal
          onClose={() => setExportOpen(false)}
          vendors={filtered.filter(v => selectedIds.has(v.id))}
        />
      )}
      
      {/* Upload Modal */}
      {uploadOpen && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          type={uploadType}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
