import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, Building2, FileText } from 'lucide-react';
import SavedVendorsPanel from './saved/SavedVendorsPanel';
import SavedQuotesPanel from './saved/SavedQuotesPanel';

const Saved = () => {
  const [params, setParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const t = (params.get('tab') || '').toLowerCase();
    return t === 'quotes' ? 'quotes' : 'vendors';
  }, [params]);

  const setTab = (next) => {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    setParams(p, { replace: true });
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Bookmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Saved</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Manage your saved vendors and quotes</p>
        </div>

        {/* Tabs header */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vendors'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            onClick={() => setTab('vendors')}
          >
            <Building2 className="w-4 h-4" />
            Vendors
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'quotes'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            onClick={() => setTab('quotes')}
          >
            <FileText className="w-4 h-4" />
            Quotes
          </button>
        </div>

        {/* Panels */}
        {activeTab === 'vendors' && <SavedVendorsPanel />}
        {activeTab === 'quotes' && <SavedQuotesPanel />}
      </div>
    </div>
  );
};

export default Saved;