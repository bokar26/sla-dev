import { useMemo, useState, useEffect, useRef } from "react";
import { getVendor, saveVendor, createQuote } from "../../services/vendors";
import { estimateQuote } from "../../services/quotesService";
import SaveVendorButton from "./SaveVendorButton";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

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
  factoryId?: string;
  initialSummary?: {
    name?: string;
    region?: string;
    capabilities?: string[];
    certs?: string[];
    score?: number;
    explanation?: string;
    country?: string;
    vendor_type?: string;
  };
  onSaved?: () => void; // Callback to refresh saved vendors list
};

export default function FactoryDetailsDrawer({
  open, onOpenChange, factoryId, initialSummary, onSaved
}: Props): JSX.Element {
  const navigate = useNavigate();
  const [details, setDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteMode, setQuoteMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState<null | {
    quote_id: string; currency: string; unit_cost: number; total_cost: number;
  }>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    inquiry_text: "",
    product_type: "",
    origin_city: "",
    origin_country_iso2: "",
    quantity: undefined as number|undefined,
    lead_time_days: undefined as number|undefined,
    materials_required: ""
  });

  // Race-safe fetch with cache
  const ctrRef = useRef<AbortController | null>(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!open || !factoryId) return;

    setDetails(null);
    setError(null);
    setLoading(true);

    tokenRef.current += 1;
    const myToken = tokenRef.current;

    if (ctrRef.current) ctrRef.current.abort();
    const ctr = new AbortController();
    ctrRef.current = ctr;

    // Optional immediate hydrate from initialSummary
    const hydratedFromSummary = initialSummary
      ? { factoryId, ...initialSummary }
      : null;
    if (hydratedFromSummary) setDetails(hydratedFromSummary);

    getVendor(factoryId, { signal: ctr.signal })
      .then((data) => {
        if (myToken !== tokenRef.current) return;
        setDetails(data);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (myToken !== tokenRef.current) return;
        
        // Better error messages
        let errorMessage = 'Could not load vendor';
        if (e.status === 404) {
          errorMessage = 'Vendor not found';
        } else if (e.status >= 500) {
          errorMessage = 'Server error - please try again';
        } else if (e.message?.includes('fetch')) {
          errorMessage = 'Network error - check connection';
        }
        
        setError(errorMessage);
        setLoading(false);
      });

    return () => ctr.abort();
  }, [open, factoryId]);

  const title = useMemo(
    () => details?.name || initialSummary?.name || "Factory Details",
    [details, initialSummary]
  );
  const loc = useMemo(
    () => details?.region || initialSummary?.region || "Unknown location",
    [details, initialSummary]
  );

  // Retry function for failed loads
  const retry = () => {
    if (!factoryId) return;
    setError(null);
    setLoading(true);
    
    tokenRef.current += 1;
    const myToken = tokenRef.current;

    if (ctrRef.current) ctrRef.current.abort();
    const ctr = new AbortController();
    ctrRef.current = ctr;

    getVendor(factoryId, { signal: ctr.signal })
      .then((data) => {
        if (myToken !== tokenRef.current) return;
        setDetails(data);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (myToken !== tokenRef.current) return;
        
        let errorMessage = 'Could not load vendor';
        if (e.status === 404) {
          errorMessage = 'Vendor not found';
        } else if (e.status >= 500) {
          errorMessage = 'Server error - please try again';
        } else if (e.message?.includes('fetch')) {
          errorMessage = 'Network error - check connection';
        }
        
        setError(errorMessage);
        setLoading(false);
      });
  };

  if (!open) return <></>;


  const onCreateQuote = async (e?: any) => {
    e?.preventDefault?.();
    if (!factoryId) {
      console.error('No factory ID available for quote creation');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        factory_id: factoryId,
        vendor_name: details?.name || initialSummary?.name || "Unknown Vendor", 
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
    if (!factoryId) {
      console.error('No factory ID available for estimate');
      return;
    }
    try {
      setEstimateLoading(true);
      setEstimateError(null);
      
      const payload = {
        vendor_id: factoryId,
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
    if (!estimate || !factoryId) return;
    try {
      const payload = {
        vendor_id: factoryId,
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
              <div className="text-xs text-slate-500">{details?.factoryId || "—"}</div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <div className="text-xs text-slate-500">{loc || "Location unknown"}</div>
            </div>
            <button className="text-slate-500 hover:text-slate-700" onClick={() => onOpenChange(false)}>✕</button>
          </div>
        </div>

        {/* Content (scrolls) */}
        <div className="flex-1 overflow-y-auto">
          {loading && <Skeleton />}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-red-600 dark:text-red-400">
                Failed to load vendor details{error?.includes('not found') ? ': Not found' : ''}.
              </p>
              <button 
                onClick={retry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="p-4 space-y-6">
              {/* Overview chips */}
              <Section title="Overview">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="MOQ" value={details?.moq !== null && details?.moq !== undefined ? String(details.moq) : "—"} />
                  <Metric label="Lead Time" value={details?.leadTimeDays !== null && details?.leadTimeDays !== undefined ? `${details.leadTimeDays} days` : "—"} />
                  <Metric label="On-Time Rate" value={details?.onTimeRate ? `${Math.round(details.onTimeRate * 100)}%` : "—"} />
                  <Metric label="Defect Rate" value={details?.defectRate ? `${Math.round(details.defectRate * 100)}%` : "—"} />
                  <Metric label="Avg Quote" value={details?.avgQuoteUsd ? `$${details.avgQuoteUsd.toFixed(2)}` : "—"} />
                  <Metric label="Certifications" value={details?.certs?.length ? `${details.certs.length}` : "—"} />
                </div>
              </Section>

              {/* Capabilities */}
              {Array.isArray(details?.capabilities) && details.capabilities.length > 0 && (
                <Section title="Capabilities">
                  <ChipList items={details.capabilities} empty="No capabilities listed" />
                </Section>
              )}

              {/* Certifications */}
              {Array.isArray(details?.certs) && details.certs.length > 0 && (
                <Section title="Certifications">
                  <ChipList items={details.certs} scheme="indigo" empty="No certifications on file" />
                </Section>
              )}

              {/* Materials */}
              {Array.isArray(details?.materials) && details.materials.length > 0 && (
                <Section title="Materials">
                  <ChipList items={details.materials} scheme="emerald" empty="No materials listed" />
                </Section>
              )}

              {/* Recent Buyers */}
              {Array.isArray(details?.recentBuyers) && details.recentBuyers.length > 0 && (
                <Section title="Recent Buyers">
                  <ChipList items={details.recentBuyers} scheme="slate" empty="No buyers listed" />
                </Section>
              )}

              {/* Compliance */}
              {details?.compliance && (
                <Section title="Compliance">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${details.compliance.iso9001 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">ISO 9001</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${details.compliance.wrap ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">WRAP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${details.compliance.sedex ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">SEDEX</span>
                    </div>
                  </div>
                </Section>
              )}

              {/* Gallery */}
              {Array.isArray(details?.images) && details.images.length > 0 && (
                <Section title="Gallery">
                  <div className="grid grid-cols-3 gap-2">
                    {details.images.map((src: string, i: number) => (
                      <img key={i} src={src} alt={`factory-${i}`} className="rounded-lg border border-slate-200 dark:border-slate-800 object-cover aspect-[4/3]" />
                    ))}
                  </div>
                </Section>
              )}

              {/* Contacts */}
              {details?.contacts && details.contacts.length > 0 && (
                <Section title="Contacts">
                  <div className="space-y-2">
                    {details.contacts.map((contact: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{contact.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{contact.email}</div>
                        {contact.phone && (
                          <div className="text-sm text-slate-600 dark:text-slate-400">{contact.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Notes */}
              {details?.notes && (
                <Section title="Notes">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{details.notes}</p>
                </Section>
              )}

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
              factoryId={factoryId}
              snapshot={normalizeVendor(details || initialSummary || {})}
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

