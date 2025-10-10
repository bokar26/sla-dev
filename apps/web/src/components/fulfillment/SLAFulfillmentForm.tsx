import React, { useState } from "react";
import { INCOTERMS, INCOTERM_FIELD_HINTS } from "../../constants/incoterms";
import { requestFulfillmentPlan, FulfillmentPayload, listSavedVendors, listSavedQuotes, SavedVendor, SavedQuote } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Tailwind glassy, light-green chip style
const glassBtn =
  "inline-flex items-center justify-center rounded-2xl border " +
  "border-emerald-300/50 bg-emerald-50/60 backdrop-blur-sm shadow-sm " +
  "px-4 py-2 md:px-5 md:py-2.5 text-emerald-900 font-medium " +
  "hover:bg-emerald-100/70 hover:shadow-md active:scale-[.99] " +
  "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";

// Glassy light-green CTA style
const ctaGlassBtn =
  "w-full rounded-2xl px-6 py-5 md:py-6 text-lg md:text-xl font-semibold " +
  "border border-emerald-300/60 bg-emerald-50/60 text-emerald-900 " +
  "backdrop-blur-sm shadow-sm hover:bg-emerald-100/70 hover:shadow-md " +
  "active:scale-[.99] transition " +
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

// Optional tiny spinner for loading state
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-700"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    role="img"
    aria-label="Loading"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

function SLAFulfillmentForm() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");

  // form state
  const [incoterm, setIncoterm] = useState<"EXW"|"FCA"|"FAS"|"FOB"|"CFR"|"CIF"|"CPT"|"CIP"|"DAP"|"DPU"|"DDP">("EXW");
  const [originCountry, setOriginCountry] = useState("China");
  const [destCountry, setDestCountry] = useState("USA");
  const [originCity, setOriginCity] = useState("");
  const [originPort, setOriginPort] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destPort, setDestPort] = useState("");
  const [readyDate, setReadyDate] = useState("");
  const [quantity, setQuantity] = useState<number|undefined>(500);
  const [weightKg, setWeightKg] = useState<number|undefined>(undefined);
  const [cbm, setCbm] = useState<number|undefined>(undefined);
  const [productType, setProductType] = useState<string>("Apparel");
  const [desc, setDesc] = useState<string>("Cotton t-shirts");
  const [hs, setHs] = useState<string>("");
  const [mode, setMode] = useState<any>("multimodal");
  const [budget, setBudget] = useState<number|undefined>();
  const [priority, setPriority] = useState<"speed"|"cost"|"balanced"|"low_co2">("balanced");

  const hints = INCOTERM_FIELD_HINTS[incoterm];

  // Helper functions for applying saved data
  const applySavedVendorToForm = (vendor: SavedVendor) => {
    if (vendor.originCountry) setOriginCountry(vendor.originCountry);
    if (vendor.destinationCountry) setDestCountry(vendor.destinationCountry);
    if (vendor.originCity) setOriginCity(vendor.originCity);
    if (vendor.destinationCity) setDestCity(vendor.destinationCity);
    if (vendor.originPort) setOriginPort(vendor.originPort);
    if (vendor.destinationPort) setDestPort(vendor.destinationPort);
    if (vendor.incoterm) setIncoterm(vendor.incoterm as any);
    if (vendor.productType) setProductType(vendor.productType);
    if (vendor.productDescription) setDesc(vendor.productDescription);
    setShowVendorModal(false);
  };

  const applySavedQuoteToForm = (quote: SavedQuote) => {
    if (quote.originCountry) setOriginCountry(quote.originCountry);
    if (quote.destinationCountry) setDestCountry(quote.destinationCountry);
    if (quote.originCity) setOriginCity(quote.originCity);
    if (quote.destinationCity) setDestCity(quote.destinationCity);
    if (quote.originPort) setOriginPort(quote.originPort);
    if (quote.destinationPort) setDestPort(quote.destinationPort);
    if (quote.incoterm) setIncoterm(quote.incoterm as any);
    if (quote.productType) setProductType(quote.productType);
    if (quote.productDescription) setDesc(quote.productDescription);
    if (quote.mode) setMode(quote.mode);
    if (quote.estimatedCostUsd) setBudget(quote.estimatedCostUsd);
    setShowQuoteModal(false);
  };

  const openVendorModal = async () => {
    setShowVendorModal(true);
    const vendors = await listSavedVendors();
    setSavedVendors(vendors);
  };

  const openQuoteModal = async () => {
    setShowQuoteModal(true);
    const quotes = await listSavedQuotes();
    setSavedQuotes(quotes);
  };

  const submit = async () => {
    setLoading(true); 
    setErr(null); 
    setPlan(null);
    
    const payload: FulfillmentPayload = {
      origin_country: originCountry,
      destination_country: destCountry,
      incoterm,
      ready_date: readyDate || undefined,
      quantity,
      weight_kg: weightKg,
      cbm,
      product_type: productType,
      product_description: desc,
      hs_code: hs || undefined,
      target_mode: mode,
      budget_usd: budget,
      priority,
      origin_city: originCity || undefined,
      origin_port: originPort || undefined,
      dest_city: destCity || undefined,
      dest_port: destPort || undefined,
    };
    
    try {
      const res = await requestFulfillmentPlan(payload);
      setPlan(res);
    } catch (e:any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-4">
        {/* Header with Action Chips */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Route Planning</h3>
          
          {/* Action chips directly under the section heading */}
          <div className="mt-3 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className={glassBtn}
              onClick={openVendorModal}
              aria-label="Fill with Saved Vendor"
            >
              Fill with Saved Vendor
            </button>

            <button
              type="button"
              className={glassBtn}
              onClick={openQuoteModal}
              aria-label="Fill with Saved Quote"
            >
              Fill with Saved Quote
            </button>
          </div>
        </div>
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Origin Country</Label>
            <Input
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              placeholder="China"
            />
          </div>
          <div>
            <Label className="mb-2 block">Destination Country</Label>
            <Input
              value={destCountry}
              onChange={(e) => setDestCountry(e.target.value)}
              placeholder="USA"
            />
          </div>
        </div>

        {/* Incoterm Selection */}
        <div>
          <Label className="mb-2 block">Incoterm</Label>
          <select
            className={selectCls}
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value as any)}
          >
            {INCOTERMS.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-1">
            {hints?.tip}
            {hints && (
              <div>Required: {hints.required.join(", ")} · Optional: {hints.optional.join(", ")}</div>
            )}
          </div>
        </div>

        {/* Conditional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hints?.required.includes("origin_city") && (
            <div>
              <Label className="mb-2 block">Origin City *</Label>
              <Input
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="Shanghai"
              />
            </div>
          )}
          {hints?.required.includes("origin_port") && (
            <div>
              <Label className="mb-2 block">Origin Port *</Label>
              <Input
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                placeholder="Shanghai Port"
              />
            </div>
          )}
          {hints?.required.includes("dest_city") && (
            <div>
              <Label className="mb-2 block">Destination City *</Label>
              <Input
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                placeholder="Los Angeles"
              />
            </div>
          )}
          {hints?.required.includes("dest_port") && (
            <div>
              <Label className="mb-2 block">Destination Port *</Label>
              <Input
                value={destPort}
                onChange={(e) => setDestPort(e.target.value)}
                placeholder="Los Angeles Port"
              />
            </div>
          )}
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hints?.optional.includes("origin_city") && (
            <div>
              <Label className="mb-2 block">Origin City</Label>
              <Input
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="Shanghai"
              />
            </div>
          )}
          {hints?.optional.includes("origin_port") && (
            <div>
              <Label className="mb-2 block">Origin Port</Label>
              <Input
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                placeholder="Shanghai Port"
              />
            </div>
          )}
          {hints?.optional.includes("dest_city") && (
            <div>
              <Label className="mb-2 block">Destination City</Label>
              <Input
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                placeholder="Los Angeles"
              />
            </div>
          )}
          {hints?.optional.includes("dest_port") && (
            <div>
              <Label className="mb-2 block">Destination Port</Label>
              <Input
                value={destPort}
                onChange={(e) => setDestPort(e.target.value)}
                placeholder="Los Angeles Port"
              />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Product Type</Label>
            <Input
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Apparel"
            />
          </div>
          <div>
            <Label className="mb-2 block">Product Description</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Cotton t-shirts"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="mb-2 block">Quantity</Label>
            <Input
              type="number"
              value={quantity || ""}
              onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="500"
            />
          </div>
          <div>
            <Label className="mb-2 block">Weight (kg)</Label>
            <Input
              type="number"
              value={weightKg || ""}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="100"
            />
          </div>
          <div>
            <Label className="mb-2 block">Volume (CBM)</Label>
            <Input
              type="number"
              value={cbm || ""}
              onChange={(e) => setCbm(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="2.5"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="mb-2 block">Target Mode</Label>
            <select
              className={selectCls}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="multimodal">Multimodal</option>
              <option value="sea">Sea</option>
              <option value="air">Air</option>
              <option value="rail">Rail</option>
              <option value="truck">Truck</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Priority</Label>
            <select
              className={selectCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="balanced">Balanced</option>
              <option value="speed">Speed</option>
              <option value="cost">Cost</option>
              <option value="low_co2">Low CO2</option>
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Budget (USD)</Label>
            <Input
              type="number"
              value={budget || ""}
              onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="5000"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Ready Date</Label>
          <Input
            type="date"
            value={readyDate}
            onChange={(e) => setReadyDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className={ctaGlassBtn}
          onClick={submit}
          disabled={loading}
          aria-label="Plan route with SLA"
        >
          {loading ? <Spinner /> : null}
          Plan route with SLA
        </button>
      </div>

      {err && <div className="text-red-600 p-3 bg-red-50 rounded">{err}</div>}

      {plan && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Route Options</h4>
          {plan.options?.map((opt:any) => (
            <div key={opt.option_id} className="rounded border p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{opt.mode.toUpperCase()} · {opt.incoterm}</div>
                <div className="text-sm text-slate-600">ETA: {opt.eta_days} days · ${opt.cost_low_usd}–${opt.cost_high_usd}</div>
              </div>
              {opt.ports?.length ? <div className="text-sm mb-1">Ports/Airports: {opt.ports.join(", ")}</div> : null}
              {opt.carriers?.length ? <div className="text-sm mb-2">Carriers: {opt.carriers.join(", ")}</div> : null}
              <div className="mt-2">
                <div className="font-semibold text-sm">Steps</div>
                <ol className="list-decimal ml-5 text-sm">
                  {opt.steps?.map((s:any, i:number)=>(
                    <li key={i}><span className="font-medium">{s.title}:</span> {s.details}</li>
                  ))}
                </ol>
              </div>
              {opt.documents?.length ? (
                <div className="mt-2 text-sm"><span className="font-semibold">Docs:</span> {opt.documents.join(", ")}</div>
              ) : null}
              {opt.risks?.length ? (
                <div className="mt-2 text-sm"><span className="font-semibold">Risks:</span> {opt.risks.join("; ")}</div>
              ) : null}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-slate-600">SLA Reasoning</summary>
                <div className="text-sm mt-1">{opt.rationale}</div>
                {plan.reasoning && <div className="text-xs mt-2 text-slate-500">{plan.reasoning}</div>}
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Saved Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Saved Vendor</h3>
              <Button variant="outline" size="sm" onClick={() => setShowVendorModal(false)}>
                Close
              </Button>
            </div>
            <Input
              placeholder="Search vendors..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedVendors
                .filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
                .map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-3 border rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => applySavedVendorToForm(vendor)}
                  >
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {vendor.country || vendor.originCountry} • {vendor.city || vendor.originCity}
                      {vendor.incoterm && ` • ${vendor.incoterm}`}
                      {vendor.productType && ` • ${vendor.productType}`}
                    </div>
                  </div>
                ))}
              {savedVendors.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No saved vendors found. Create some vendors first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Saved Quote</h3>
              <Button variant="outline" size="sm" onClick={() => setShowQuoteModal(false)}>
                Close
              </Button>
            </div>
            <Input
              placeholder="Search quotes..."
              value={quoteSearch}
              onChange={(e) => setQuoteSearch(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedQuotes
                .filter(q => (q.quoteId || q.id).toLowerCase().includes(quoteSearch.toLowerCase()))
                .map((quote) => (
                  <div
                    key={quote.id}
                    className="p-3 border rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => applySavedQuoteToForm(quote)}
                  >
                    <div className="font-medium">Quote {quote.quoteId || quote.id}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {quote.lanes || `${quote.originCountry} → ${quote.destinationCountry}`}
                      {quote.mode && ` • ${quote.mode}`}
                      {quote.incoterm && ` • ${quote.incoterm}`}
                      {quote.estimatedCostUsd && ` • $${quote.estimatedCostUsd}`}
                    </div>
                  </div>
                ))}
              {savedQuotes.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No saved quotes found. Create some quotes first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with SLA branding
export { SLAFulfillmentForm };

// Backwards-compatible alias for old imports
export { SLAFulfillmentForm as LLMFulfillmentForm };

// Default export
export default SLAFulfillmentForm;
