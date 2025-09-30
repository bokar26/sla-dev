import React, { useMemo, useState, useEffect } from 'react';
import { FileText, ChevronRight, Search, X, Calendar, DollarSign, Package, Clock, Download, Upload } from 'lucide-react';
import { useSavedQuotes } from '@/stores/savedQuotes';
import { listSavedQuotes } from '@/services/quotesService';
import UploadModal from './UploadModal';

function QuoteRow({ q, onOpen }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(q)}
      className="w-full text-left px-4 py-3 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {q.title || `Quote ${q.number || q.id}`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {q.vendorName || q.vendor?.name || '—'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {q.amount != null && (
          <span className="text-sm text-slate-900 dark:text-slate-100">
            {Intl.NumberFormat(undefined, { style: 'currency', currency: q.currency || 'USD' }).format(q.amount)}
          </span>
        )}
        {q.status && (
          <span className={`px-2 py-0.5 text-[11px] rounded-full uppercase tracking-wide ${getStatusColor(q.status)}`}>
            {q.status}
          </span>
        )}
        <ChevronRight className="size-4 text-slate-400 dark:text-slate-500" />
      </div>
    </button>
  );
}

function QuoteDetails({ open, onOpenChange, quote }) {
  if (!open || !quote) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="ml-auto h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-medium">Quote</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {quote.title || `Quote ${quote.number || quote.id}`}
            </h2>
            {quote.vendorName && (
              <div className="text-sm text-slate-500 dark:text-slate-400">{quote.vendorName}</div>
            )}
          </div>
          <button
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            onClick={() => onOpenChange(false)}
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basic Information */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">
                <strong>Amount:</strong> {quote.amount != null
                  ? Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency || 'USD' }).format(quote.amount)
                  : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full uppercase tracking-wide ${getStatusColor(quote.status)}`}>
                {quote.status || '—'}
              </span>
            </div>
            {quote.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Created:</strong> {new Date(quote.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {quote.validUntil && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Valid Until:</strong> {new Date(quote.validUntil).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Line Items */}
        {quote.lineItems && quote.lineItems.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Line Items</h3>
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Qty</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Unit Price</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {quote.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-neutral-900">{item.description}</td>
                      <td className="px-3 py-2 text-neutral-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-neutral-700">
                        {Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency || 'USD' }).format(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-neutral-700 font-medium">
                        {Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency || 'USD' }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Terms and Notes */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Terms & Notes</h3>
          <div className="space-y-3">
            {quote.terms && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <p className="text-sm text-neutral-700">
                  <strong>Payment Terms:</strong> {quote.terms}
                </p>
              </div>
            )}
            {quote.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <p className="text-sm text-neutral-700">
                  <strong>Notes:</strong> {quote.notes}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Attachments */}
        {quote.attachments && quote.attachments.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Attachments</h3>
            <div className="space-y-2">
              {quote.attachments.map((attachment, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{attachment.name}</p>
                    <p className="text-xs text-neutral-500">{attachment.size}</p>
                  </div>
                  <button
                    className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function SavedQuotesPanel() {
  const { items, order, setAll, addMany } = useSavedQuotes();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  
  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);

  // Load saved quotes from API
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await listSavedQuotes();
        setAll(data.items || []);
      } catch (e) {
        setErr(e?.message ?? String(e));
        console.error('Failed to load quotes:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuotes();
  }, [setAll]);

  // Convert store data to array for filtering
  const quotes = useMemo(() => {
    return order.map(id => items[id]).filter(Boolean);
  }, [items, order]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(x => {
      const hay = [
        x.title, x.number, x.status, x.vendorName, x.vendor?.name,
        x.currency, String(x.amount ?? '')
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [quotes, query]);

  if (err) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Saved Quotes</h2>
            <p className="text-sm text-muted-foreground">Error loading quotes</p>
          </div>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-medium">Failed to load quotes</div>
          <div className="mt-1">{err}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const onOpen = (quote) => { setSelected(quote); setOpen(true); };

  // Upload handlers
  const handleUploadSuccess = async (result) => {
    // Optimistically add new quotes to the store
    if (result.created && Array.isArray(result.created)) {
      addMany(result.created);
      console.log('Uploaded quotes:', result.created);
    }
    
    // Show success message
    console.log(`Uploaded ${result.created?.length || 0} quotes`);
    
    // Background refetch to ensure consistency
    try {
      const data = await listSavedQuotes();
      setAll(data.items || []);
    } catch (e) {
      console.error('Failed to refresh quotes:', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Saved Quotes</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} quote{filtered.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        
        <button
          onClick={() => setUploadOpen(true)}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload quotes
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filtered.length} quote${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Quotes List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-200 dark:divide-slate-800">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))
          : filtered.map((q) => <QuoteRow key={q.id || q.number} q={q} onOpen={onOpen} />)}
      </div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No quotes found</h3>
          <p className="text-muted-foreground mb-4">
            {query ? "Try adjusting your search" : "No saved quotes available"}
          </p>
          {!query && (
            <button
              onClick={() => setUploadOpen(true)}
              className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 mx-auto"
            >
              <Upload className="w-4 h-4" />
              Upload quotes
            </button>
          )}
        </div>
      )}

      <QuoteDetails open={open} onOpenChange={setOpen} quote={selected} />
      
      {/* Upload Modal */}
      {uploadOpen && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          type="quotes"
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
