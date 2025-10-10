import { useMemo, useState, useEffect, useRef } from "react";
import { getVendor, saveVendor, createQuote } from "../../services/vendors";
import { estimateQuote } from "../../services/quotesService";
import SaveVendorButton from "./SaveVendorButton";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { getSupplier, getSupplierDetails } from "../../lib/api";
import type { SupplierListItem, SupplierProfile } from "../../types/supplier";

type VendorLike = {
  name?: string;
  region?: string;
  capabilities?: string[];
  certs?: string[];
  score?: number;
  // possibly present from API:
  country?: string;
  vendor_type?: string;
};

function normalizeVendor(v: Partial<VendorLike>) {
  return {
    name: v.name ?? "",
    region: v.region ?? "",
    country: v.country ?? v.region ?? "", // fall back so UI doesn't crash
    vendorType: v.vendor_type ?? "factory",
    capabilities: v.capabilities ?? [],
    certs: v.certs ?? [],
    score: typeof v.score === "number" ? v.score : undefined
  };
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialItem?: SupplierListItem;
  onSaved?: () => void; // Callback to refresh saved vendors list
};

export default function FactoryDetailsDrawer({
  open, onOpenChange, initialItem, onSaved
}: Props): JSX.Element {
  const supplierId = initialItem?.id || null;
  const navigate = useNavigate();
  const [item, setItem] = useState<SupplierListItem | null>(initialItem || null);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [quoteMode, setQuoteMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState<null | {
    quote_id: string; currency: string; unit_cost: number; total_cost: number;
  }>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [form, setForm] = useState({
    inquiry_text: "",
    product_type: "",
    origin_city: "",
    origin_country_iso2: "",
    quantity: undefined as number|undefined,
    lead_time_days: undefined as number|undefined,
    materials_required: ""
  });

  // Smart merge function to preserve reasoning from clicked results
  function smartMerge(prev: any, full: any) {
    if (!prev) return full;
    // Keep prev reasoning if full doesn't have it
    const merged = { ...full, ...prev }; // prev wins for missing keys in full
    if (!full?.reasons?.length && prev?.reasons?.length) merged.reasons = prev.reasons;
    if (!full?.explain && prev?.explain) merged.explain = prev.explain;
    if (!full?.contributions && prev?.contributions) merged.contributions = prev.contributions;
    if (typeof full?.score !== "number" && typeof prev?.score === "number") merged.score = prev.score;
    return merged;
  }

  // Load supplier details using new unified endpoint
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!initialItem) return;
      
      setLoading(true); 
      setErr(null);
      setLiveError(null);
      setProfile(null);
      
      try {
        const details = await getSupplierDetails({
          id: initialItem.id,
          name: initialItem.name,
          url: initialItem.sourceUrl || initialItem.url || undefined,
          source: initialItem.source,
          country: initialItem.country,
          product_type: initialItem.productTypes?.[0]
        });
        
        if (alive) {
          // Set the enriched profile
          setProfile(details.profile || null);
          
          // Show live error as warning, not blocking error
          if (details.live_error) {
            setLiveError(details.live_error);
          }
        }
      } catch (e: any) {
        if (alive) {
          setErr(String(e?.message || e));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [initialItem]);

  const title = useMemo(
    () => profile?.name || item?.name || "Supplier",
    [profile, item]
  );
  const loc = useMemo(
    () => profile?.country || profile?.region || item?.country || item?.region || "Unknown location",
    [profile, item]
  );

  if (!open) return <></>;

  const onCreateQuote = async (e?: any) => {
    e?.preventDefault?.();
    if (!supplierId) {
      console.error('No supplier ID available for quote creation');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        factory_id: supplierId,
        vendor_name: item?.name || "Unknown Vendor", 
        ...form 
      };
      const res = await createQuote(payload);
      toast({ title: "Quote created", description: res.ref });
      setQuoteMode(false);
    } catch(e:any){ 
      toast({ title: "Create quote failed", description: e.message, variant: "destructive" }); 
    }
    finally { 
      setSaving(false); 
    }
  };

  const onEstimateQuote = async () => {
    if (!supplierId) {
      console.error('No supplier ID available for estimate');
      return;
    }
    try {
      setEstimateLoading(true);
      setEstimateError(null);
      
      const payload = {
        vendor_id: supplierId,
        product: {
          type: form.product_type || "General",
          materials: form.materials_required || "Standard",
          weight_kg: 0.5, // Default assumption
          dimensions: "Standard"
        },
        quantity: form.quantity || 1000,
        destination: {
          country: form.origin_country_iso2 || "US",
          city: form.origin_city || "New York"
        },
        incoterm: "FOB",
        freight_type: "sea",
        speed: "standard"
      };
      
      const res = await estimateQuote(payload);
      setEstimate(res);
      toast({ title: "Estimate ready", description: "Review and open details for negotiation tips." });
    } catch (e: any) {
      setEstimateError(String(e?.message || e));
    } finally {
      setEstimateLoading(false);
    }
  };

  const onViewDetails = async () => {
    if (!estimate || !supplierId) return;
    try {
      const payload = {
        vendor_id: supplierId,
        product: {
          type: form.product_type || "General",
          materials: form.materials_required || "Standard",
          weight_kg: 0.5,
          dimensions: "Standard"
        },
        quantity: form.quantity || 1000,
        destination: {
          country: form.origin_country_iso2 || "US",
          city: form.origin_city || "New York"
        },
        incoterm: "FOB",
        freight_type: "sea",
        speed: "standard",
        estimate
      };
      
      const saved = await estimateQuote(payload);
      const quoteId = saved.quote_id || saved.id;

      // Navigate to Saved page → Quotes tab and auto-open that card
      navigate(`/app/saved?tab=quotes&open=1&quoteId=${encodeURIComponent(quoteId)}`, {
        state: { tab: "quotes", open: "1", quoteId },
        replace: false,
      });
    } catch (e: any) {
      toast({ title: "Could not save quote", description: String(e?.message || e), variant: "destructive" });
    }
  };

  const resetQuote = () => {
    setForm({
      inquiry_text: "",
      product_type: "",
      origin_city: "",
      origin_country_iso2: "",
      quantity: undefined,
      lead_time_days: undefined,
      materials_required: ""
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[640px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">{item?.id || "—"}</div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <div className="text-xs text-slate-500">{loc || "Location unknown"}</div>
              
              {/* Error notice */}
              {err && (
                <div className="text-xs text-rose-600 mb-2">
                  Live profile unavailable ({err}). Showing cached result.
                </div>
              )}
              
              {/* Loading indicator */}
              {loading && <div className="text-xs text-slate-500 mt-2">Loading live profile…</div>}
              
              {/* Source link and badges */}
              {(profile?.sourceUrl || profile?.url || item?.sourceUrl || item?.url) && (
                <a 
                  href={profile?.sourceUrl || profile?.url || item?.sourceUrl || item?.url || "#"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs underline text-blue-600 hover:text-blue-700 mt-1 inline-block"
                >
                  Open site →
                </a>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {item?.source && (
                  <span className="text-[11px] px-2 py-1 rounded border bg-slate-50 dark:bg-slate-800">Source: {item.source}</span>
                )}
                {/* Alibaba statuses if present */}
                {item?.marketplaceMeta?.alibaba?.gold_member ? (
                  <span className="text-[11px] px-2 py-1 rounded border bg-amber-50 text-amber-900">Alibaba: Gold Member</span>
                ) : null}
                {typeof item?.marketplaceMeta?.alibaba?.export_to_us === "number" ? (
                  <span className="text-[11px] px-2 py-1 rounded border bg-slate-50 dark:bg-slate-800">
                    Exports to US: {item.marketplaceMeta.alibaba.export_to_us}
                  </span>
                ) : null}
                {typeof item?.marketplaceMeta?.alibaba?.export_companies === "number" ? (
                  <span className="text-[11px] px-2 py-1 rounded border bg-slate-50 dark:bg-slate-800">
                    US Companies: {item.marketplaceMeta.alibaba.export_companies}
                  </span>
                ) : null}
              </div>
            </div>
            <button className="text-slate-500 hover:text-slate-700" onClick={() => onOpenChange(false)}>✕</button>
          </div>
        </div>

        {/* Content (scrolls) */}
        <div className="flex-1 overflow-y-auto">
          {!item && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-slate-600 dark:text-slate-400">No supplier data available</p>
            </div>
          )}
          {item && (
            <div className="p-4 space-y-6">
              {/* Live error warning (non-blocking) */}
              {liveError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ Live profile enrichment failed — showing cached/internal data: {liveError}
                  </div>
                </div>
              )}
              
              {/* Key facts */}
              <Section title="Key Facts">
                <div className="grid grid-cols-2 gap-3">
                  {(profile?.materials || item?.materials)?.length ? (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500">Materials</div>
                      <div>{(profile?.materials || item?.materials)?.join(", ")}</div>
                    </div>
                  ) : null}
                  {(profile?.certs || item?.certs)?.length ? (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500">Certifications</div>
                      <div>{(profile?.certs || item?.certs)?.join(", ")}</div>
                    </div>
                  ) : null}
                  {(profile?.moq || item?.moq) ? (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500">MOQ</div>
                      <div>{profile?.moq || item?.moq}</div>
                    </div>
                  ) : null}
                  {(profile?.leadDays || profile?.leadTime || item?.leadDays) ? (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500">Lead Time</div>
                      <div>{profile?.leadDays || profile?.leadTime || item?.leadDays} days</div>
                    </div>
                  ) : null}
                  {(profile?.priceUsd || item?.priceUsd) ? (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500">Ref. Price</div>
                      <div>${profile?.priceUsd || item?.priceUsd}</div>
                    </div>
                  ) : null}
                  <div className="text-sm">
                    <div className="text-xs text-slate-500">Score</div>
                    <div>{Math.round((profile?.score || item?.score) || 0)}/100</div>
                  </div>
                </div>
              </Section>

              {/* SLA Reasoning */}
              <Section title="">
                <button 
                  onClick={()=>setShowReasoning(v=>!v)} 
                  className="text-xs underline text-slate-500 dark:text-slate-400 mt-3"
                >
                  {showReasoning ? "Hide SLA Reasoning" : "SLA Reasoning"}
                </button>
                {showReasoning && (
                  <div className="mt-2 border rounded-md p-3 bg-slate-50 dark:bg-slate-800 space-y-3">
                    {(profile?.reasoning || item?.reasoning) ? <p className="text-sm">{profile?.reasoning || item?.reasoning}</p> : null}
                    
                    {/* Contributions bar chart */}
                    {(profile?.contributions || item?.contributions) && Object.keys(profile?.contributions || item?.contributions || {}).length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-2">Score contributions:</div>
                        <div className="space-y-2">
                          {Object.entries(profile?.contributions || item?.contributions || {})
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .map(([factor, score]) => (
                            <div key={factor} className="flex items-center gap-2">
                              <div className="text-xs w-20 text-slate-600 dark:text-slate-400 capitalize">
                                {factor.replace(/_/g, ' ')}
                              </div>
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.max(0, Math.min(100, (score as number) * 100))}%` }}
                                />
                              </div>
                              <div className="text-xs w-8 text-slate-600 dark:text-slate-400 text-right">
                                {Math.round((score as number) * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {Array.isArray(item.reasons) && item.reasons.length ? (
                      <>
                        <div className="text-xs font-medium mb-1">Key factors:</div>
                        <ul className="list-disc pl-5 text-xs space-y-1">
                          {item.reasons.map((r,i)=><li key={i}>{r}</li>)}
                        </ul>
                      </>
                    ) : <div className="text-xs text-slate-500">No extra reasoning available.</div>}
                  </div>
                )}
              </Section>

              {/* Quote block (inline, above footer buttons) */}
              {quoteMode && (
                <Section title="Create Quote">
                  <div className="space-y-4">
                    {/* Estimate section */}

                    {/* Original quote form */}
                    <form onSubmit={onCreateQuote} className="space-y-3">
                    <div>
                      <label className="block text-xs mb-1">Inquiry</label>
                      <textarea value={form.inquiry_text} onChange={e=>setForm({...form, inquiry_text: e.target.value})}
                                rows={3} className="w-full rounded-lg border px-3 py-2 text-sm"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1">Product Type</label>
                        <input value={form.product_type || ""} onChange={e=>setForm({...form, product_type: e.target.value})}
                               className="w-full h-9 rounded-lg border px-3 text-sm"/>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Quantity</label>
                        <input type="number" value={form.quantity ?? ""} onChange={e=>setForm({...form, quantity: e.target.valueAsNumber || undefined})}
                               className="w-full h-9 rounded-lg border px-3 text-sm"/>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Lead Time (days)</label>
                        <input type="number" value={form.lead_time_days ?? ""} onChange={e=>setForm({...form, lead_time_days: e.target.valueAsNumber || undefined})}
                               className="w-full h-9 rounded-lg border px-3 text-sm"/>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Materials Required</label>
                        <input value={form.materials_required} onChange={e=>setForm({...form, materials_required: e.target.value})}
                               className="w-full h-9 rounded-lg border px-3 text-sm" placeholder="e.g., 200gsm cotton, YKK zippers"/>
                      </div>
                    </div>

                    {/* readonly origin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1">Origin City</label>
                        <input value={form.origin_city || ""} readOnly className="w-full h-9 rounded-lg border px-3 text-sm bg-slate-50"/>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Origin Country</label>
                        <input value={form.origin_country_iso2 || ""} readOnly className="w-full h-9 rounded-lg border px-3 text-sm bg-slate-50"/>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button 
                        type="button" 
                        disabled={estimateLoading}
                        onClick={onEstimateQuote}
                        className={btnPrimary()}
                      >
                        {estimateLoading ? "Calculating…" : "Quote"}
                      </button>
                      <button type="button" onClick={resetQuote} className={btnGhost()}>
                        Reset
                      </button>
                    </div>
                    
                    {estimateError && (
                      <p className="text-xs text-red-600 mt-2">{estimateError}</p>
                    )}
                    
                    {/* Inline estimate preview card */}
                    {estimate && (
                      <div className="rounded-xl border p-3 mt-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Estimated unit</div>
                            <div className="text-2xl font-semibold">
                              {estimate.currency} {estimate.unit_cost.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Estimated total</div>
                            <div className="text-2xl font-semibold">
                              {estimate.currency} {estimate.total_cost.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <p className="mt-2 text-xs italic text-gray-600">
                          This is an estimate to be used as a baseline for negotiations.
                        </p>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={onViewDetails}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    )}
                    </form>
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons (always at bottom) */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setQuoteMode(v=>!v)} className={btnPrimary()}>
              {quoteMode ? "Close Quote Form" : "Create Quote"}
            </button>
            <SaveVendorButton 
              factoryId={supplierId || undefined}
              snapshot={normalizeVendor(item || {})}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Subcomponents / helpers ---------- */

function Section({ title, children }: {title: string; children: React.ReactNode}) {
  return (
    <section>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
        {children}
      </div>
    </section>
  );
}

function Metric({ label, value }: {label: string; value: string}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ChipList({ items, empty, scheme = "emerald" }: {items?: string[]; empty: string; scheme?: "emerald"|"indigo"|"slate"}) {
  if (!items || items.length === 0) return <div className="text-sm text-slate-500">{empty}</div>;
  const base = {
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
    indigo:  "bg-indigo-50  text-indigo-900  border-indigo-200  dark:bg-indigo-900/20  dark:text-indigo-200  dark:border-indigo-800",
    slate:   "bg-slate-100  text-slate-900   border-slate-200   dark:bg-slate-800/40   dark:text-slate-200   dark:border-slate-700",
  }[scheme];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className={`px-2 py-1 text-xs rounded-md border ${base}`}>{t}</span>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({length:4}).map((_,i)=> <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800"/>)}
      </div>
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function btnPrimary() {
  return "h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold";
}
function btnSecondary() {
  return "h-10 px-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold";
}
function btnGhost() {
  return "h-10 px-4 rounded-full bg-slate-200/70 dark:bg-slate-800/60 text-sm";
}

