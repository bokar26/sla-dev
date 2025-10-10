import React, { useEffect, useState } from "react";
import { getIncoterms, makePlan } from "../../lib/api";

const FALLBACK_TERMS = {
  EXW: { label: "Ex Works", required_fields: ["origin_city","origin_country","pickup_ready_date"] },
  FCA: { label: "Free Carrier", required_fields: ["origin_city","origin_country","handoff_location"] },
  FAS: { label: "Free Alongside Ship", required_fields: ["origin_port","cutoff_date"] },
  FOB: { label: "Free On Board", required_fields: ["origin_port","vessel_cutoff_date"] },
  CFR: { label: "Cost & Freight", required_fields: ["origin_port","destination_port"] },
  CIF: { label: "Cost, Insurance & Freight", required_fields: ["origin_port","destination_port","insured_value_usd"] },
  CPT: { label: "Carriage Paid To", required_fields: ["handoff_location","destination_city","destination_country"] },
  CIP: { label: "Carriage & Insurance Paid", required_fields: ["handoff_location","destination_city","destination_country","insured_value_usd"] },
  DAP: { label: "Delivered At Place", required_fields: ["destination_city","destination_country","delivery_address"] },
  DPU: { label: "Delivered at Place Unloaded", required_fields: ["destination_city","destination_country","unload_site"] },
  DDP: { label: "Delivered Duty Paid", required_fields: ["origin_city","origin_country","destination_city","destination_country","delivery_address"] }
};

export default function IncotermsForm({ onPlan }) {
  const [terms, setTerms] = useState(FALLBACK_TERMS);
  const [incoterm, setIncoterm] = useState("DDP");
  const [fields, setFields] = useState({});
  const [reqFields, setReqFields] = useState(FALLBACK_TERMS.DDP.required_fields);
  const [missing, setMissing] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Try to load from backend; if it fails, keep fallback so UI still shows.
  useEffect(() => {
    (async () => {
      try {
        const data = await getIncoterms();
        if (data?.terms && Object.keys(data.terms).length) {
          setTerms(data.terms);
          const need = data.terms[incoterm]?.required_fields || [];
          setReqFields(need);
          setFields(Object.fromEntries(need.map(k => [k, ""])));
        }
      } catch (e) {
        console.warn("[Incoterms] Using fallback terms:", e);
      }
    })();
  }, []);

  useEffect(() => {
    const cfg = terms[incoterm] || { required_fields: [] };
    const need = cfg.required_fields || [];
    setReqFields(need);
    setFields(prev => {
      const next = {};
      need.forEach(k => (next[k] = prev?.[k] ?? ""));
      return next;
    });
    setMissing([]);
    setPlan(null);
  }, [incoterm, terms]);

  const validate = async () => {
    try {
      setLoading(true); setError(null);
      const res = await makePlan({ incoterm, fields });
      setMissing(res?.missing_fields || []);
      setPlan(res?.normalized || null);
      onPlan?.(res);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2">Shipping terms</h4>

      <label className="block text-sm font-medium mb-1">Incoterms</label>
      <select
        value={incoterm}
        onChange={(e)=> setIncoterm(e.target.value)}
        className="border rounded-md px-3 py-2 mb-3"
        data-testid="incoterms-select"
      >
        {Object.keys(terms).map(t => (
          <option key={t} value={t}>{t} — {terms[t].label}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reqFields.map(k => (
          <div key={k} className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{k.replace(/_/g," ")}</label>
            <input
              value={fields[k] ?? ""}
              onChange={(e)=> setFields(prev => ({...prev, [k]: e.target.value}))}
              placeholder={`Enter ${k.replace(/_/g," ")}`}
              className="border rounded-md px-2 py-2"
            />
          </div>
        ))}
      </div>

      <button onClick={validate} className="mt-3 px-4 py-2 rounded-md border">
        {loading ? "Validating…" : "Validate Plan"}
      </button>

      {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}
      {missing.length > 0 && (
        <div className="mt-2 text-xs text-rose-600">Missing: {missing.join(", ")}</div>
      )}
      {plan && (
        <div className="mt-3 border rounded-md p-2 text-sm bg-gray-50">
          <div className="font-medium mb-1">Plan (normalized)</div>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
