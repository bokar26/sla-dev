import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSavedQuotes } from "@/stores/savedQuotes";

// Saved page should render **content only**; the dashboard route already provides the layout.
// Do NOT import any layout or globe here.

// Replaced demo/mock with real API call: see services/serviceMap.md
import { apiGet } from "@/lib/api";

export function useOpenQuoteFromLocation() {
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const st = location.state || {};
  const tab = st.tab || qs.get("tab");
  const quoteId = st.quoteId || qs.get("quoteId");
  const open = (st.open || qs.get("open")) === "1";
  return { tab, quoteId, open };
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
  </div>
);

const Empty = ({ title, hint, to, cta }) => (
  <div className="flex flex-col items-center justify-center text-center py-16">
    <div className="text-4xl mb-3">🔖</div>
    <h3 className="text-lg font-semibold">{title}</h3>
    {hint && <p className="text-slate-500 mt-1">{hint}</p>}
    {to && (
      <Link
        to={to}
        className="mt-4 inline-flex rounded-md bg-emerald-600 px-3.5 py-2 text-white hover:bg-emerald-700"
      >
        {cta || "Go to Search"}
      </Link>
    )}
  </div>
);

const useSaved = () => {
  const [data, setData] = useState({
    // These keys may or may not exist; we normalize below
    suppliers: [],
    factories: [],
    clients: [], // some repos call factories "clients"
    quotes: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // Fetch real data from APIs
        if (!ignore) {
          const [suppliersRes, quotesRes] = await Promise.all([
            apiGet('/saved/factories'),
            apiGet('/saved-quotes')
          ]);
          
          const suppliers = suppliersRes?.items || [];
          const quotes = quotesRes?.items || [];
          
          setData({ 
            suppliers, 
            factories: [], // TODO: Add factories API endpoint
            quotes 
          });
        }
      } catch (e) {
        if (!ignore) setErr(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return { data, loading, err };
};

// Best-effort vendor type detection
function inferVendorType(item) {
  const t =
    item?.type ||
    item?.kind ||
    (item?.isFactory ? "factory" : undefined) ||
    (item?.isSupplier ? "supplier" : undefined) ||
    (item?.factory_id ? "factory" : undefined) ||
    (Array.isArray(item?.tags) && item.tags.includes("factory") ? "factory" : undefined);

  if (typeof t === "string") {
    const v = t.toLowerCase();
    if (v.includes("factory")) return "factory";
    if (v.includes("supplier")) return "supplier";
  }
  // Fallback heuristic
  if ("capacity" in (item || {}) || "machines" in (item || {})) return "factory";
  return "supplier";
}

const Segmented = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-lg border bg-slate-50 p-0.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1.5 text-sm rounded-md ${
          value === opt.value
            ? "bg-white border shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {opt.label}
        {typeof opt.count === "number" && (
          <span className="ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-slate-100 px-1 text-xs">
            {opt.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-2 border-b mb-4">
    {tabs.map((t) => (
      <button
        key={t.key}
        className={`px-3 py-2 rounded-t-md text-sm font-medium ${
          active === t.key
            ? "bg-white border border-b-white -mb-px"
            : "text-slate-500 hover:text-slate-800"
        }`}
        onClick={() => onChange(t.key)}
      >
        {t.label}
        {typeof t.count === "number" && (
          <span className="ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-slate-100 px-1 text-xs">
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

const CardList = ({ items, renderItem, emptyTitle, emptyHint }) => {
  if (!items?.length) {
    return <Empty title={emptyTitle} hint={emptyHint} to="/app/sla-search" cta="Search vendors" />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {items.map((it) => renderItem(it))}
    </div>
  );
};

export default function SavedPage(): JSX.Element {
  const { data, loading, err } = useSaved();
  const { tab, quoteId, open } = useOpenQuoteFromLocation();
  const { items } = useSavedQuotes();
  const [openQuoteId, setOpenQuoteId] = useState(null);

  // Normalize vendors: combine factories + suppliers (some repos call factories "clients")
  const suppliers = Array.isArray(data.suppliers) ? data.suppliers : [];
  const factoriesFromKey = Array.isArray(data.factories) ? data.factories : [];
  const clientsAsFactories = Array.isArray(data.clients) ? data.clients : [];

  const factories = factoriesFromKey.length ? factoriesFromKey : clientsAsFactories;

  const vendorsAll = useMemo(() => {
    const withType = (arr, fallbackType) =>
      arr.map((v) => ({ ...v, __vendorType: inferVendorType(v) || fallbackType }));
    return [...withType(factories, "factory"), ...withType(suppliers, "supplier")];
  }, [factories, suppliers]);

  const [activeTab, setActiveTab] = useState(tab === "quotes" ? "quotes" : "vendors"); // 'vendors' | 'quotes'
  const [vendorFilter, setVendorFilter] = useState("all"); // 'all' | 'factory' | 'supplier'

  // Auto-open quote if requested
  useEffect(() => {
    if (tab === "quotes" && open && quoteId) {
      if (items[quoteId]) setOpenQuoteId(quoteId);
      else setTimeout(() => { 
        if (items[quoteId]) setOpenQuoteId(quoteId); 
      }, 250);
    }
  }, [tab, open, quoteId, items]);

  const quotes = Array.isArray(data.quotes) ? data.quotes : [];

  const filteredVendors = useMemo(() => {
    if (vendorFilter === "factory") return vendorsAll.filter((v) => v.__vendorType === "factory");
    if (vendorFilter === "supplier") return vendorsAll.filter((v) => v.__vendorType === "supplier");
    return vendorsAll;
  }, [vendorsAll, vendorFilter]);

  const tabs = useMemo(
    () => [
      { key: "vendors", label: "Vendors", count: vendorsAll.length },
      { key: "quotes", label: "Quotes", count: quotes.length },
    ],
    [vendorsAll.length, quotes.length]
  );

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="text-slate-500">Keep vendors and quotes in one place.</p>
      </header>

      <section className="mt-4">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div
          className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 md:p-5 overflow-y-auto"
          style={{ height: "clamp(360px,60vh,calc(100vh - 240px))" }}
        >
          {loading && <Spinner />}
          {!loading && err && (
            <Empty title="Failed to load saved items" hint="Please try again later." />
          )}

          {!loading && !err && activeTab === "vendors" && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <Segmented
                  value={vendorFilter}
                  onChange={setVendorFilter}
                  options={[
                    { value: "all", label: "All", count: vendorsAll.length },
                    { value: "factory", label: "Factories", count: vendorsAll.filter(v => v.__vendorType === "factory").length },
                    { value: "supplier", label: "Suppliers", count: vendorsAll.filter(v => v.__vendorType === "supplier").length },
                  ]}
                />
              </div>

              <CardList
                items={filteredVendors}
                emptyTitle="No saved vendors"
                emptyHint="Save factories or suppliers from SLA Search or Fulfillment."
                renderItem={(item) => (
                  <div key={item.id || item.name} className="flex flex-col gap-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {item.name || item.title || "Untitled vendor"}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                          {item.location || item.city || item.region || ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          item.__vendorType === "factory"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {item.__vendorType === "factory" ? "Factory" : "Supplier"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {item.updated_at && (
                        <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                      )}
                      {item.lead_time && <span>Lead time: {item.lead_time}</span>}
                      {item.capacity && <span>Capacity: {item.capacity}</span>}
                      {item.tags?.length
                        ? item.tags.map((t) => (
                            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5">
                              {t}
                            </span>
                          ))
                        : null}
                    </div>

                    <div className="mt-2 flex gap-2">
                      {item.href && (
                        <Link
                          to={item.href}
                          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          View
                        </Link>
                      )}
                      <button
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => console.log("TODO: remove vendor", item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              />
            </>
          )}

          {!loading && !err && activeTab === "quotes" && (
            <>
              <CardList
                items={quotes}
                emptyTitle="No saved quotes"
                emptyHint="Generate and save quotes from Search or Fulfillment."
                renderItem={(item) => (
                  <div key={item.id || item.title} className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.title || "Quote"}</h3>
                        <p className="text-slate-500 text-sm mt-1">
                          {item.vendor || item.supplier || ""}
                        </p>
                      </div>
                      {typeof item.total === "number" && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          Total: {Intl.NumberFormat(undefined, { style: "currency", currency: item.currency || "USD" }).format(item.total)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {item.updated_at && (
                        <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                      )}
                      {item.lead_time && <span>Lead time: {item.lead_time}</span>}
                    </div>

                    <div className="mt-2 flex gap-2">
                      {item.href && (
                        <Link
                          to={item.href}
                          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          View
                        </Link>
                      )}
                      <button
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => console.log("TODO: remove quote", item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              />
              
              {/* Auto-open quote details */}
              {openQuoteId && items[openQuoteId] && (
                <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                  <div className="text-sm text-slate-600 mb-2">Quote Details</div>
                  <div className="text-lg font-semibold">{items[openQuoteId].title || "Quote"}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {items[openQuoteId].vendor || items[openQuoteId].supplier || ""}
                  </div>
                  <button
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setOpenQuoteId(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
