import React, { useState, useEffect, Suspense, lazy } from "react";
import GlobeLoader from "../../components/GlobeLoader";
import SavingsMiniCard from "../../components/savings/SavingsMiniCard";
import DropZone from "../../components/DropZone";
import { searchFactories as localSearchFactories } from "../../services/slaSearch";
import { getVendor, prefetchVendor, saveVendor, createQuote } from "../../services/vendors";
import { getSavedVendorIds } from "../../services/uploadsService";
import { useSavedVendorIds } from "../../stores/savedVendorIds";
import { extractFactoryId, debugFactoryId } from "../../utils/idUtils";
import { getSupplyCenterMetrics } from "../../services/metricsService";
import { ingestSearchWithFile, searchFactoriesUnified as apiSearchFactories, unifiedSearch, llmSearch, apiPost, uploadImageForCaption } from "../../lib/api";
import { COUNTRIES, PRODUCT_TYPES } from "../../constants/catalog";

// TODO: Revert to live API values after the demo.
// Replaced demo/mock with real API call: see services/serviceMap.md

// Null-safe utilities
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const safeJoin = (v, sep = ", ") =>
  Array.isArray(v) ? v.join(sep) : typeof v === "string" ? v : "";

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
  const [loadingMsg, setLoadingMsg] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  
  // Search form state
  const [location, setLocation] = useState("China");
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState(500);           // default
  const [customization, setCustomization] = useState(null); // null=Any, true=Yes, false=No
  const [meta, setMeta] = useState(null);
  
  // Upload state for DropZone
  const [uploads, setUploads] = useState([]);
  
  // Image caption state
  const [imageCaption, setImageCaption] = useState("");
  
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
    initialItem: undefined 
  });


  async function onSearch(e) {
    e?.preventDefault?.();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    setSearching(true);
    setLoadingMsg("Deep search (multi-provider)…");
    setSearchError(null);
    
    // Keep previous results visible during search (smooth loading)
    // Don't clear results immediately to prevent layout jump
    
    try {
      const response = await llmSearch({
        q: searchQuery,
        country: location || undefined,
        product_type: productType === 'Any' ? undefined : productType,
        quantity: quantity || undefined,
        customization: customization || "any",
        image_label: meta?.image_label || undefined,
        min_score: 80
      });
      
      setLoadingMsg("");
      setSearchResults(Array.isArray(response.items) ? response.items : []);
      setMeta(response.meta || null);
      
      // Log search passes for debugging
      if (response.meta?.passes) {
        console.log('Search passes:', response.meta.passes);
      }
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
      setLoadingMsg("");
    }
  }

  // Handle file uploads from DropZone
  const handleInlineFiles = async (files) => {
    const f = files[0];
    setUploads((u) => [{ name: f.name, status: "uploading" }, ...u]);
    
    // Check if it's an image file
    const isImage = f.type.startsWith('image/');
    let caption = "";
    
    if (isImage) {
      try {
        const captionResult = await uploadImageForCaption(f);
        caption = captionResult.caption || "";
        setImageCaption(caption);
        setUploads((u) => u.map(item => 
          item.name === f.name ? { ...item, status: "done", caption } : item
        ));
      } catch (error) {
        console.error("Image caption error:", error);
        setUploads((u) => u.map(item => 
          item.name === f.name ? { ...item, status: "error", err: error.message } : item
        ));
        return;
      }
    }
    
    try {
      setUploads((u) => u.map(x => x.name === f.name ? { ...x, status: "extracting" } : x));
      
      const data = await ingestSearchWithFile(f, { 
        include_freshness: true, 
        location: location,
        product_type_hint: productType || undefined
      });

      if (data.query_text) setSearchQuery(data.query_text);
      if (!productType && data.extract?.product_type) {
        setProductType(data.extract.product_type);
      }
      if ((data.extract?.materials || []).length) {
        // Could add materials state if needed
        console.log('Extracted materials:', data.extract.materials);
      }
      if (data.search?.items?.length) {
        setSearchResults(Array.isArray(data.search.items) ? data.search.items : []);
        setHasSearched(true);
      }
      
      setUploads((u) => u.map(x => x.name === f.name ? { ...x, status: "done" } : x));
    } catch (e) {
      setUploads((u) => u.map(x => x.name === f.name ? { ...x, status: "error", err: String(e.message || e) } : x));
    }
  };

  // Use real search results
  const results = hasSearched && !searching ? searchResults : [];

  // Prefetch vendor details on hover for smoother UX
  const handleVendorHover = (item) => {
    const factoryId = extractFactoryId(item);
    if (factoryId) {
      prefetchVendor(factoryId);
    }
  };

  // Open vendor details panel with the clicked item
  const openVendor = (item) => {
    setVendorPanel({
      open: true,
      initialItem: item
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
      // Quick sanity check for ingestSearchWithFile
      console.log("has ingestSearchWithFile:", typeof ingestSearchWithFile === "function");
      
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
            
            {/* NEW: DropZone ABOVE the text input */}
            <DropZone variant="compact" onFiles={handleInlineFiles} className="mb-2" />
            
            {/* Image label display */}
            {meta?.image_label && (
              <div className="mt-1 text-[11px] text-red-500">
                Identified (image): {meta.image_label}
              </div>
            )}
            
            <p className="text-xs text-slate-500 mb-2">Drop an image/spec PDF above, or type a query below.</p>
            
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:dark:text-slate-500 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="t shirt"
            />

            {/* Compact upload status */}
            {uploads.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {uploads.slice(0,1).map(u => (
                  <div key={u.name}>
                    <span>
                      {u.name}:{" "}
                      <span className={u.status==="done" ? "text-emerald-500" : u.status==="error" ? "text-rose-500" : "text-slate-500"}>
                        {u.status}{u.err ? ` — ${u.err}` : ""}
                      </span>
                    </span>
                    {u.caption && (
                      <div className="mt-1 text-red-600 font-medium">
                        Image: {u.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
                 {/* Show current image caption */}
                 {imageCaption && (
                   <div className="mt-2 text-xs text-red-600 font-medium">
                     Current image: {imageCaption}
                   </div>
                 )}
                 
                 {/* Show identified product from image */}
                 {meta?.image_summary && (
                   <div className="mt-1 text-[11px] text-red-500">
                     Image: {meta.image_summary}
                   </div>
                 )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">LOCATION</label>
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-slate-400"
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country === "Any" ? "" : country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">PRODUCT TYPE</label>
                <select 
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-slate-400"
                >
                  {PRODUCT_TYPES.map(type => (
                    <option key={type} value={type === "Any" ? "" : type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">QUANTITY</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e)=> setQuantity(Number(e.target.value || 0))}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-slate-400"
                placeholder="500"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">CUSTOMIZATION</label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={()=> setCustomization(null)}
                  className={`px-3 py-1 rounded border text-sm ${customization===null ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >Any</button>
                <button
                  type="button"
                  onClick={()=> setCustomization(true)}
                  className={`px-3 py-1 rounded border text-sm ${customization===true ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >Yes</button>
                <button
                  type="button"
                  onClick={()=> setCustomization(false)}
                  className={`px-3 py-1 rounded border text-sm ${customization===false ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >No</button>
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
                setLocation("China");
                setProductType("");
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
                    <span className="text-sm font-medium">{loadingMsg || "Searching across internal & live sources…"}</span>
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
                <>
                  {meta?.warning && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      {meta.warning}
                    </div>
                  )}
                  <ul className="space-y-3">
                  {(Array.isArray(results) ? results : []).map((r, i) => {
                    const factoryId = extractFactoryId(r);
                    const isSaved = factoryId && savedVendorIds.has(factoryId);
                    return (
                      <li 
                        key={factoryId || r.name || i} 
                        className={`relative rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${r?.is_best ? "ring-2 ring-emerald-500" : ""}`}
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
                        aria-label={`View details for ${r?.name || "Supplier"}`}
                      >
                      <div className="flex items-center justify-between">
                        <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                          {r?.name || "Supplier"}
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
                          {r?.is_best && (
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
                        {r?.country || "Unknown"} • 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                          (r?.score || 0) >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          (r?.score || 0) >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          (r?.score || 0) >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          Score: {Math.round(r?.score || 0)}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                        Materials: {safeJoin(r.materials)}
                      </div>
                      {r.certs?.length > 0 && (
                        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                          Certifications: {safeJoin(r.certs)}
                        </div>
                      )}
                      {(r?.moq || 0) > 0 && (
                        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                          MOQ: {r?.moq || 0} units • Lead time: {r?.leadDays || 0} days
                        </div>
                      )}
                      {(r?.rationale || r?.reasoning) && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-[12px] text-blue-800 dark:text-blue-200">
                          <strong>SLA Reasoning:</strong> {r.rationale || r.reasoning}
                        </div>
                      )}
                             {(() => {
                               const siteUrl = r?.url ?? r?.source?.url ?? r?.raw?.url ?? r?.raw?.website ?? null;
                               return siteUrl ? (
                                 <div className="mt-2">
                                   <a href={siteUrl} target="_blank" rel="noreferrer" className="text-xs underline text-blue-600 dark:text-blue-400">
                                     Open site →
                                   </a>
                                 </div>
                               ) : (
                                 <div className="mt-2">
                                   <span className="text-xs text-slate-400 dark:text-slate-500">No website</span>
                                 </div>
                               );
                             })()}
                      
                      {/* Source badge bottom-right */}
                      <div className="absolute right-2 bottom-2 text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        Source: {r?.source || "internal"}
                        {r?.sourceUrl ? (
                          <>
                            {" "}
                            • <a className="underline" href={r.sourceUrl} target="_blank" rel="noreferrer">Open</a>
                          </>
                        ) : null}
                      </div>
                    </li>
                    );
                  })}
                </ul>
                  {meta && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                      {meta.relaxed && (
                        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-amber-800 dark:text-amber-200">
                          ⚠️ Showing best available matches; threshold relaxed from {meta.min_score} to {meta.final_threshold}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <strong>Search Stats:</strong><br/>
                          Internal candidates: {meta.internal_candidates || 0}<br/>
                          Web search used: {meta.used_web ? "Yes" : "No"}<br/>
                          Elapsed: {meta.elapsed_ms}ms
                        </div>
                        <div>
                          <strong>Results:</strong><br/>
                          Returned: {results.length}/{meta.top_k}<br/>
                          Min score: {meta.min_score}<br/>
                          Final threshold: {meta.final_threshold}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : hasSearched && !searching ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    No factories scored ≥ 80 after deep search.<br/>
                    {meta?.passes && (
                      <span className="text-xs">
                        Pass stats: {meta.passes.map(p=>`#${p.pass} kept ${p.kept}/${p.candidates}`).join(" · ")} ·
                        Providers: {meta.providers_used ? Object.entries(meta.providers_used).map(([k,v])=>`${k}:${v}`).join(", ") : "—"}
                      </span>
                    )}
                  </p>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    <p>Suggestions:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Broaden your search terms</li>
                      <li>• Try different product categories</li>
                      <li>• Check spelling</li>
                      <li>• Remove filters to see more results</li>
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
          key={vendorPanel.initialItem?.id}
          open={vendorPanel.open}
          onOpenChange={(o) => setVendorPanel(v => ({ ...v, open: o }))}
          initialItem={vendorPanel.initialItem}
          onSaved={() => {
            // Add the vendor ID to the saved IDs store
            if (vendorPanel.initialItem?.id) {
              addId(vendorPanel.initialItem.id);
            }
            console.log("Vendor saved - refresh saved vendors list");
          }}
        />
      </Suspense>
    </div>
  );
}
