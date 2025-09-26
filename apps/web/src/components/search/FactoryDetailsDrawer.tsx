import { useMemo, useState } from "react";
import { saveFactory } from "../../hooks/useSaveFactory";
import { createQuote } from "../../hooks/useCreateQuote";

type Props = {
  open: boolean;
  onClose: () => void;
  factory: any | null;                  // { id, vendor_name, site_name, country_iso2, city, capabilities[], certifications[], past_clients[], moq, lead_time_days, capacity_units_month?, images[] }
  loading?: boolean;
  inquiryPrefill: {
    inquiry_text?: string;
    product_type?: string;
    origin_city?: string;
    origin_country_iso2?: string;
  };
  onQuoteCreated?: (q: {id:string; ref:string}) => void;
};

export default function FactoryDetailsDrawer({
  open, onClose, factory, loading = false, inquiryPrefill, onQuoteCreated
}: Props) {
  const [saving, setSaving] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [form, setForm] = useState({
    inquiry_text: inquiryPrefill.inquiry_text || "",
    product_type: inquiryPrefill.product_type || "",
    origin_city: inquiryPrefill.origin_city || "",
    origin_country_iso2: inquiryPrefill.origin_country_iso2 || "",
    quantity: undefined as number|undefined,
    lead_time_days: undefined as number|undefined,
    materials_required: ""
  });

  const title = useMemo(
    () => factory?.site_name || factory?.vendor_name || "Factory Details",
    [factory]
  );
  const loc = useMemo(
    () => [factory?.city, factory?.country_iso2].filter(Boolean).join(", "),
    [factory]
  );

  if (!open) return null;

  const onSaveFactory = async () => {
    try { setSaving(true); await saveFactory(factory.id); toast("Factory saved"); }
    catch(e:any){ toast(`Save failed: ${e.message}`, true); }
    finally { setSaving(false); }
  };

  const onCreateQuote = async (e?: any) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      const payload = { factory_id: factory.id, vendor_name: factory.vendor_name, ...form };
      const res = await createQuote(payload);
      toast(`Quote created: ${res.ref}`);
      onQuoteCreated?.(res);
      setQuoteMode(false);
    } catch(e:any){ toast(`Create quote failed: ${e.message}`, true); }
    finally { setSaving(false); }
  };

  const resetQuote = () => {
    setForm({
      inquiry_text: inquiryPrefill.inquiry_text || "",
      product_type: inquiryPrefill.product_type || "",
      origin_city: inquiryPrefill.origin_city || "",
      origin_country_iso2: inquiryPrefill.origin_country_iso2 || "",
      quantity: undefined, lead_time_days: undefined, materials_required: ""
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[640px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">{factory?.vendor_name || "—"}</div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <div className="text-xs text-slate-500">{loc || "Location unknown"}</div>
            </div>
            <button className="text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content (scrolls) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? <Skeleton /> : (
            <div className="p-4 space-y-6">
              {/* Overview chips */}
              <Section title="Overview">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="MOQ" value={factory?.moq !== null && factory?.moq !== undefined ? String(factory.moq) : "—"} />
                  <Metric label="Lead Time" value={factory?.lead_time_days !== null && factory?.lead_time_days !== undefined ? `${factory.lead_time_days} days` : "—"} />
                  <Metric label="Capacity" value={factory?.capacity_units_month !== null && factory?.capacity_units_month !== undefined ? `${factory.capacity_units_month}/mo` : "—"} />
                  <Metric label="Certifications" value={factory?.certifications?.length ? `${factory.certifications.length}` : "—"} />
                </div>
              </Section>

              {/* Capabilities */}
              <Section title="Capabilities">
                <ChipList items={factory?.capabilities} empty="No capabilities listed" />
              </Section>

              {/* Certifications */}
              <Section title="Certifications">
                <ChipList items={factory?.certifications} scheme="indigo" empty="No certifications on file" />
              </Section>

              {/* Past Clients */}
              <Section title="Past Clients">
                <ChipList items={factory?.past_clients} scheme="slate" empty="No clients listed" />
              </Section>

              {/* Gallery */}
              {Array.isArray(factory?.images) && factory.images.length > 0 && (
                <Section title="Gallery">
                  <div className="grid grid-cols-3 gap-2">
                    {factory.images.map((src: string, i: number) => (
                      <img key={i} src={src} alt={`factory-${i}`} className="rounded-lg border border-slate-200 dark:border-slate-800 object-cover aspect-[4/3]" />
                    ))}
                  </div>
                </Section>
              )}

              {/* Quote block (inline, above footer buttons) */}
              {quoteMode && (
                <Section title="Create Quote">
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
                      <button type="submit" disabled={saving}
                        className={btnPrimary()}>
                        {saving ? "Saving…" : "Save Quote"}
                      </button>
                      <button type="button" onClick={resetQuote} className={btnGhost()}>
                        Reset
                      </button>
                    </div>
                  </form>
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
            <button onClick={onSaveFactory} disabled={saving} className={btnSecondary()}>
              {saving ? "Saving…" : "Save Factory"}
            </button>
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

function toast(msg: string, isErr = false) {
  // lightweight fallback; replace with your toaster if available
  isErr ? console.error(msg) : console.log(msg);
}
