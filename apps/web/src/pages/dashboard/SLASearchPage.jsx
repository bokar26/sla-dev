import React, { useState, useEffect, Suspense, lazy } from "react";
import GlobeLoader from "../../components/GlobeLoader";
import SavingsMiniCard from "../../components/savings/SavingsMiniCard";
import { searchFactories } from "../../services/slaSearch";
import { getVendor, prefetchVendor, saveVendor, createQuote } from "../../services/vendors";
import { getSavedVendorIds } from "../../services/uploadsService";
import { useSavedVendorIds } from "../../stores/savedVendorIds";
import { extractFactoryId, debugFactoryId } from "../../utils/idUtils";
import { getSupplyCenterMetrics } from "../../services/metricsService";

// TODO: Revert to live API values after the demo.
// Replaced demo/mock with real API call: see services/serviceMap.md

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtHours = (h) => `${Math.max(0, Math.round(h))}h`;
// Lazy load the heavy FactoryDetailsDrawer component
const FactoryDetailsDrawer = lazy(() => import("../../components/search/FactoryDetailsDrawer"));

// Height shared by the left "Search Query" textarea and the right results/globe container.
// Tweak to taste if you want it a bit shorter/taller.
const RESULTS_HEIGHT = 'clamp(320px, 60vh, calc(100vh - 240px))';

export default function SLASearchPage() {
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  
  // Real metrics from API
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        const data = await getSupplyCenterMetrics();
        setMetrics(data);
        setMetricsError(null);
      } catch (err) {
        setMetricsError(err.message);
        console.error('Failed to load metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);
  
  // Compute percentages from real API data
  const timePct = metrics && metrics.total_without_sla?.value > 0 
    ? Math.min(1, metrics.time_saved?.value / metrics.total_without_sla?.value) 
    : 0;
  const costPct = metrics && metrics.total_without_sla?.value > 0 
    ? Math.min(1, metrics.cost_saved?.value / metrics.total_without_sla?.value) 
    : 0;
  
  // Saved vendor IDs for cross-checking
  const { ids: savedVendorIds, setIds, addId } = useSavedVendorIds();
  
  // Vendor details panel state
  const [vendorPanel, setVendorPanel] = useState({ 
    open: false, 
    factoryId: undefined, 
    initialSummary: undefined 
  });


  async function onSearch(e) {
    e?.preventDefault?.();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    setSearching(true);
    setSearchError(null);
    
    // Keep previous results visible during search (smooth loading)
    // Don't clear results immediately to prevent layout jump
    
    try {
      const response = await searchFactories(searchQuery, {
        topK: 25,
        filters: {
          ingestedOnly: true
        }
      });
      
      setSearchResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
      if (error.message === 'Request superseded') {
        // Ignore superseded requests (race safety)
        return;
      }
      setSearchError(error.message || 'Search failed');
      // Only clear results on actual errors, not on aborted requests
      if (error.name !== 'AbortError') {
        setSearchResults([]);
      }
    } finally {
      setSearching(false);
    }
  }

  // Use real search results
  const results = hasSearched && !searching ? searchResults : [];

  // Prefetch vendor details on hover for smoother UX
  const handleVendorHover = (item) => {
    const factoryId = extractFactoryId(item);
    if (factoryId) {
      prefetchVendor(factoryId);
    }
  };

  // Open vendor details panel with normalized ID
  const openVendor = (item) => {
    const factoryId = extractFactoryId(item);
    
    // Debug in development
    debugFactoryId(item, 'openVendor');
    
    if (!factoryId) {
      console.error('No valid factory ID found in item:', item);
      return;
    }
    
    setVendorPanel({
      open: true,
      factoryId,
      initialSummary: {
        name: item.name,
        region: item.region,
        capabilities: item.capabilities,
        certs: item.certs,
        score: item.score,
        explanation: item.explanation
      }
    });
  };

  // Load saved vendor IDs on mount
  useEffect(() => {
    const loadSavedIds = async () => {
      try {
        const result = await getSavedVendorIds();
        setIds(result.ids || []);
      } catch (error) {
        console.error('Failed to load saved vendor IDs:', error);
      }
    };
    
    loadSavedIds();
  }, [setIds]);

  // Dev smoke test (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__sla_ping = async () => {
        try {
          const r = await apiPost('/ai/search', { 
            q: 'terry hoodie Portugal 500 MOQ', 
            filters: { ingestedOnly: true },
              topK: 5
            });
          console.log('SLA /search:', r);
        } catch (error) {
          console.error('SLA ping failed:', error);
        }
      };
    }
  }, []);

  return (
    <div className="min-h-screen overflow-hidden px-6 pt-6">
      <h1 className="text-3xl font-bold text-slate-900">SLA Search</h1>
      <p className="mt-1 text-slate-500">
        AI-powered factory search. Filter on the left, results on the right.
      </p>

      {/* 2-column layout */}
      <div className="mt-6 grid grid-cols-[360px_minmax(0,1fr)] gap-6 max-w-screen-2xl">
        {/* LEFT: filters/search */}
        <aside className="sticky top-20 self-start">
          {/* Search Query Card - moved to top */}
          <form
            onSubmit={onSearch}
            className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 md:p-5 shadow-sm"
          >
            <label className="text-xs font-medium text-slate-600">SEARCH QUERY</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:dark:text-slate-500 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="t shirt"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">LOCATION</label>
                <select className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-slate-400">
                  <option>China</option>
                  <option>Vietnam</option>
                  <option>India</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">PRODUCT TYPE</label>
                <select className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-slate-400">
                  <option>Activewear</option>
                  <option>Footwear</option>
                  <option>Outerwear</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:translate-y-px"
            >
              Search Factories
            </button>
          </form>

          {/* Sourcing Savings Header */}
          <div className="mt-6 mb-3">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Sourcing Savings</h3>
          </div>

          {/* Compact Savings Trackers */}
          <div className="space-y-3">
            <SavingsMiniCard
              title="TIME SAVINGS"
              savedLabel={metricsLoading ? "Saved: Loading..." : `Saved: ${fmtHours(metrics?.time_saved?.value || 0)}`}
              rightLabelKey="Total time spent:"
              rightLabelValue={metricsLoading ? "Loading..." : fmtHours(metrics?.total_with_sla?.value || 0)}
              rightCalloutKey="Without SLA:"
              rightCalloutValue={metricsLoading ? "Loading..." : fmtHours(metrics?.total_without_sla?.value || 0)}
              progress={timePct}
              loading={false}
              error={null}
              className="w-full"
            />

            <SavingsMiniCard
              title="COST SAVINGS"
              savedLabel={metricsLoading ? "Saved: Loading..." : `Saved: ${fmtCurrency(metrics?.cost_saved?.value || 0)}`}
              rightLabelKey="Total spend:"
              rightLabelValue={metricsLoading ? "Loading..." : fmtCurrency(metrics?.total_with_sla?.value || 0)}
              rightCalloutKey="Without SLA:"
              rightCalloutValue={metricsLoading ? "Loading..." : fmtCurrency(metrics?.total_without_sla?.value || 0)}
              progress={costPct}
              loading={false}
              error={null}
              className="w-full"
            />
          </div>
        </aside>

        {/* RIGHT: results panel with its own scroll */}
        <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors shadow-sm">
          {/* Header row for the results panel */}
          <div className="flex items-center justify-between border-b dark:border-slate-800 transition-colors p-4 md:p-5">
            <h3 className="text-base font-semibold text-slate-800">
              Top Factory Matches
            </h3>
            <button
              type="button"
              className="rounded-full border border-blue-500 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setHasSearched(false);
                setSearching(false);
                setSearchQuery("");
                setSearchResults([]);
                setSearchError(null);
              }}
            >
              Reset
            </button>
          </div>

          {/* Scrollable results area */}
          <div 
            className="relative overflow-y-auto overscroll-contain p-4 md:p-5"
            style={{ height: RESULTS_HEIGHT }}
          >
            {/* BEFORE first search: idle globe */}
            {!hasSearched && (
              <div className="absolute inset-0 grid place-items-center">
                <GlobeLoader size={320} subtitle="Start a search to see top factory matches" />
              </div>
            )}

            {/* DURING search: overlay with globe */}
            {hasSearched && searching && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/70 backdrop-blur-sm">
                <GlobeLoader size={280} subtitle="Finding best factory matches..." />
              </div>
            )}

            {/* RESULTS LIST */}
            <div
              className={[
                "relative transition-opacity duration-300",
                hasSearched ? "opacity-100" : "opacity-0",
                searching ? "pointer-events-none select-none opacity-50" : ""
              ].join(" ")}
              aria-hidden={!hasSearched}
            >
              {/* Loading overlay for smooth transitions */}
              {searching && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    <span className="text-sm font-medium">Searching...</span>
                  </div>
                </div>
              )}
              {searchError ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-800 dark:text-red-200">
                    {searchError}
                  </div>
                </div>
              ) : results?.length ? (
                <ul className="space-y-3">
                  {results.map((r, i) => {
                    const factoryId = extractFactoryId(r);
                    const isSaved = factoryId && savedVendorIds.has(factoryId);
                    return (
                      <li 
                        key={factoryId || r.name || i} 
                        className="rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => openVendor(r)}
                        onMouseEnter={() => handleVendorHover(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openVendor(r);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${r.name}`}
                      >
                      <div className="flex items-center justify-between">
                        <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                          {r.name}
                        </div>
                        <div className="flex items-center gap-2">
                          {isSaved && (
                            <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-[12px] font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Saved
                            </span>
                          )}
                          {i === 0 && (
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                              Best match
                            </span>
                          )}
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
                        {r.region} • Score: {Math.round(r.score * 100)}%
                      </div>
                      <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                        Capabilities: {r.capabilities.join(", ")}
                      </div>
                      {r.certs?.length > 0 && (
                        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                          Certifications: {r.certs.join(", ")}
                        </div>
                      )}
                      {r.moq > 0 && (
                        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                          MOQ: {r.moq} units • Lead time: {r.leadTimeDays} days
                        </div>
                      )}
                      {r.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-[12px] text-blue-800 dark:text-blue-200">
                          <strong>Why this:</strong> {r.explanation}
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              ) : hasSearched && !searching ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    No matches found. Try adjusting your search terms.
                  </p>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    <p>Suggestions:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Broaden your search terms</li>
                      <li>• Try different product categories</li>
                      <li>• Check spelling</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* Vendor Details Panel */}
      <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading vendor details...</p>
        </div>
      </div>}>
        <FactoryDetailsDrawer
          key={vendorPanel.factoryId}
          open={vendorPanel.open}
          onOpenChange={(o) => setVendorPanel(v => ({ ...v, open: o }))}
          factoryId={vendorPanel.factoryId}
          initialSummary={vendorPanel.initialSummary}
          onSaved={() => {
            // Add the vendor ID to the saved IDs store
            if (vendorPanel.factoryId) {
              addId(vendorPanel.factoryId);
            }
            console.log("Vendor saved - refresh saved vendors list");
          }}
        />
      </Suspense>
    </div>
  );
}
