import { useEffect, useState } from "react";
import { getNegotiationTips } from "@/services/quotesService";

interface QuoteDetailsProps {
  quote: {
    id: string;
    status: string;
    currency: string;
    estimate_total?: number;
    estimate_breakdown?: Array<{
      label: string;
      amount: number;
      pct: number;
    }>;
    estimate_assumptions?: Record<string, any>;
    negotiation_tips?: string[];
  };
}

export default function QuoteDetails({ quote }: QuoteDetailsProps) {
  const [tips, setTips] = useState<string[] | null>(quote.negotiation_tips ?? null);
  const [loading, setLoading] = useState(false);
  const [vendorPrice, setVendorPrice] = useState<string>("");

  useEffect(() => {
    if (!tips && quote.status === "estimate") {
      (async () => {
        try {
          setLoading(true);
          const res = await getNegotiationTips(quote.id);
          setTips(res.tips || []);
        } finally { 
          setLoading(false); 
        }
      })();
    }
  }, [quote.id, quote.status, tips]);

  const bd = quote.estimate_breakdown || [];
  const asm = quote.estimate_assumptions || {};

  return (
    <div className="space-y-6">
      {/* Cost Basis */}
      <section>
        <h3 className="text-lg font-semibold">Cost basis</h3>
        <p className="text-sm text-gray-600">
          How this estimate was calculated.
        </p>
        <div className="mt-3 space-y-2">
          {bd.map((b: any) => (
            <div key={b.label} className="flex items-center justify-between text-sm">
              <span>{b.label}</span>
              <span className="font-medium">
                {quote.currency} {Number(b.amount).toFixed(2)} 
                {b.pct != null ? ` (${Math.round(b.pct * 100)}%)` : ""}
              </span>
            </div>
          ))}
        </div>
        {/* Assumptions */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
          {"moq" in asm && (
            <div>
              MOQ: <span className="font-medium text-gray-900">{asm.moq}</span>
            </div>
          )}
          {"lead_time_days" in asm && (
            <div>
              Lead time: <span className="font-medium text-gray-900">{asm.lead_time_days} days</span>
            </div>
          )}
          {"route" in asm && (
            <div>
              Route: <span className="font-medium text-gray-900">{asm.route}</span>
            </div>
          )}
          {"duties_rate" in asm && (
            <div>
              Duties: <span className="font-medium text-gray-900">{Math.round(asm.duties_rate * 100)}%</span>
            </div>
          )}
          {"weight_kg" in asm && (
            <div>
              Weight: <span className="font-medium text-gray-900">{asm.weight_kg} kg</span>
            </div>
          )}
        </div>
      </section>

      {/* Negotiation Tips */}
      <section>
        <h3 className="text-lg font-semibold">Negotiation tips</h3>
        <p className="text-sm text-gray-600">
          Suggestions based on the cost drivers above.
        </p>
        {loading && <p className="text-sm">Loading…</p>}
        {!loading && tips && tips.length > 0 ? (
          <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
            {tips.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : !loading ? (
          <p className="text-sm text-gray-600">No tips available.</p>
        ) : null}
      </section>

      {/* Vendor quote compare */}
      <section>
        <h3 className="text-lg font-semibold">Compare vendor quote</h3>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            placeholder={`${quote.currency} ${quote.estimate_total?.toFixed?.(2) ?? ""}`}
            className="w-40 rounded-md border px-2 py-1 text-sm"
            value={vendorPrice}
            onChange={(e) => setVendorPrice(e.target.value)}
          />
          <button
            type="button"
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            onClick={() => {
              const vendor = Number(vendorPrice || 0);
              const est = Number(quote.estimate_total || 0);
              if (!vendor || !est) return;
              const diff = vendor - est;
              alert(
                diff > 0
                  ? `Vendor is ${quote.currency} ${diff.toLocaleString()} above estimate. Use the tips focusing on the largest drivers to close the gap.`
                  : `Vendor is at/under estimate. Consider locking terms and checking lead time/quality clauses.`
              );
            }}
          >
            Analyze
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Enter their quoted total to compare vs the estimate and select the most relevant levers.
        </p>
      </section>
    </div>
  );
}
