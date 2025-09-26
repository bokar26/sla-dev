// src/features/fulfillment/ShippingWizard.tsx
import React from 'react';
import { getQuotes, getQuoteById } from '@/services/quotes';
import {
  startShippingPlan,
  streamShippingPlan,
  type ShippingOption,
  type ShippingPreference,
} from '@/services/shipping';

type Step = 'select' | 'plan' | 'options' | 'review';

export default function ShippingWizard() {
  const [step, setStep] = React.useState<Step>('select');

  // Inputs
  const [quotes, setQuotes] = React.useState<any[]>([]);
  const [quoteId, setQuoteId] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [preference, setPreference] = React.useState<ShippingPreference>('balanced');

  // Progress / results
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [options, setOptions] = React.useState<ShippingOption[]>([]);
  const [selected, setSelected] = React.useState<ShippingOption | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load quotes for dropdown
  React.useEffect(() => {
    (async () => {
      try {
        const list = await getQuotes();
        setQuotes(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.warn('Failed to load quotes', e);
      }
    })();
  }, []);

  const beginPlanning = async () => {
    if (!quoteId || !destination) return;
    setError(null);
    setLogs([]);
    setOptions([]);
    setSelected(null);
    setStep('plan');
    setLoading(true);

    try {
      const { taskId } = await startShippingPlan({ quoteId, destination, preference });
      setTaskId(taskId);

      // Live stream
      const unsubscribe = streamShippingPlan(taskId, (evt) => {
        if (evt.type === 'progress' && evt.message) {
          setLogs((l) => [...l, evt.message]);
        } else if (evt.type === 'options' && evt.options) {
          setOptions(evt.options);
          setStep('options');
        } else if (evt.type === 'error') {
          setError(evt.message || 'Planner error');
          setStep('select');
        } else if (evt.type === 'done') {
          // keep last state
        }
      });

      // Stop stream when unmounting or step leaves planning
      return () => unsubscribe();
    } catch (e: any) {
      setError(e?.message || 'Failed to start planner');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const confirmSelection = () => {
    if (!selected) return;
    setStep('review');
  };

  const download = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const makeInvoice = () => {
    if (!selected) return;
    const txt = `INVOICE
Carrier: ${selected.carrier} - ${selected.service}
Route: ${selected.route.join(' > ')}
Origin: ${selected.origin}
Destination: ${selected.destination}
ETA (days): ${selected.etaDays}
Price (USD): ${selected.priceUsd}
Weight (kg): ${selected.weightKg}
Volume (m3): ${selected.volumeM3}`;
    download('invoice.txt', txt);
  };

  const makeProductionStatement = () => {
    if (!selected) return;
    const txt = `PRODUCTION STATEMENT
Shipment Service: ${selected.service}
Notes: ${selected.notes || 'N/A'}
... (add SKU lines pulled from quote)`;
    download('production-statement.txt', txt);
  };

  const makePackingList = () => {
    if (!selected) return;
    const txt = `PACKING LIST
Origin: ${selected.origin}
Destination: ${selected.destination}
Weight (kg): ${selected.weightKg}
Volume (m3): ${selected.volumeM3}
... (add carton breakdown from quote)`;
    download('packing-list.txt', txt);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-neutral-900 dark:border-neutral-800">
      <h3 className="text-lg font-semibold mb-3">Shipping Planner</h3>

      {step === 'select' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Quote</label>
            <select
              value={quoteId}
              onChange={(e) => setQuoteId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="">Choose quote…</option>
              {quotes.map((q: any) => (
                <option key={q.id} value={q.id}>
                  {q.id} — {q.sku ?? 'SKU'} — ${q.price} {q.currency ?? 'USD'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City, Country (or full address)"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preference</label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value as ShippingPreference)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
              <option value="cheapest">Cheapest</option>
              <option value="green">Lowest CO₂</option>
            </select>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            onClick={beginPlanning}
            disabled={!quoteId || !destination || loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Start Planning'}
          </button>
        </div>
      )}

      {step === 'plan' && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">AI is compiling shipping data…</div>
          <ul className="space-y-2 text-sm">
            {logs.map((l, i) => (
              <li key={i} className="rounded border border-gray-200 p-2 dark:border-neutral-800">
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 'options' && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Select a shipping option</div>
          <ul className="space-y-2">
            {options.map((o) => (
              <li
                key={o.id}
                onClick={() => setSelected(o)}
                className={`cursor-pointer rounded border p-3 dark:border-neutral-800 ${
                  selected?.id === o.id ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'
                }`}
              >
                <div className="font-medium">{o.carrier} — {o.service}</div>
                <div className="text-xs text-muted-foreground">
                  {o.origin} → {o.destination} · {o.etaDays} days · ${o.priceUsd} · {o.weightKg}kg / {o.volumeM3}m³
                  {o.co2kg ? ` · CO₂ ${o.co2kg}kg` : ''}
                </div>
                <div className="text-[11px] text-muted-foreground">{o.route.join(' > ')}</div>
              </li>
            ))}
          </ul>
          <button
            onClick={confirmSelection}
            disabled={!selected}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Confirm Selection
          </button>
        </div>
      )}

      {step === 'review' && selected && (
        <div className="space-y-3">
          <div className="text-sm">Create documents</div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded border px-3 py-2" onClick={makeInvoice}>Download Invoice</button>
            <button className="rounded border px-3 py-2" onClick={makeProductionStatement}>Download Production Statement</button>
            <button className="rounded border px-3 py-2" onClick={makePackingList}>Download Packing List</button>
          </div>
          <div className="text-xs text-muted-foreground">
            You can also print these from your browser's print dialog.
          </div>
        </div>
      )}
    </div>
  );
}
