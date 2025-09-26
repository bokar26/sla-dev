export type MetricPoint = { t: string; revenue: number; commission: number; volume: number };

export async function getSupplyMetricsMock(): Promise<MetricPoint[]> {
  const base = Date.now(), days = 14, out: MetricPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(base - i * 86400000);
    const volume = 200 + Math.round(Math.random() * 180);
    const revenue = 50000 + Math.round(volume * (200 + Math.random() * 50));
    const commission = Math.round(revenue * (0.05 + Math.random() * 0.03));
    out.push({ t: d.toISOString(), revenue, commission, volume });
  }
  return out;
}

export type Vendor = { id: string; name: string; region: string; rating: number };

export async function getRecentVendorsMock(): Promise<Vendor[]> {
  return [
    { id: 'v1', name: 'VN-Textiles 23', region: 'Vietnam', rating: 4.7 },
    { id: 'v2', name: 'IN-Knit Mills 12', region: 'India', rating: 4.5 },
    { id: 'v3', name: 'BD-Garments 8', region: 'Bangladesh', rating: 4.3 },
  ];
}

export type Quote = { id: string; sku: string; price: number; currency: string; vendorId?: string };

export async function getRecentQuotesMock(): Promise<Quote[]> {
  return [
    { id: 'q1', sku: 'HOODIE-400GSM-BLK', price: 8.5, currency: 'USD', vendorId: 'v2' },
    { id: 'q2', sku: 'TEE-240GSM-WHT', price: 2.1, currency: 'USD', vendorId: 'v1' },
  ];
}

export type NewsItem = { id: string; title: string; source: string; time: string };

export async function getCurrentNewsMock(): Promise<NewsItem[]> {
  return [
    { id: 'n1', title: 'Cotton prices steady as shipping normalizes', source: 'SLA Wire', time: '2h ago' },
    { id: 'n2', title: 'Vietnam logistics rates drop 8% WoW', source: 'SLA Wire', time: '5h ago' },
  ];
}

export type Suggestion = { id: string; text: string };

export async function getAiSuggestionsMock(): Promise<Suggestion[]> {
  return [
    { id: 's1', text: 'Shift 15% of hoodie SKUs to Tiruppur to cut lead time ~6 days.' },
    { id: 's2', text: 'Consolidate two PO shipments via Nhava Sheva to save ~$1.2k.' },
  ];
}

export type Spark = number[]; // normalized 0..1 sequence for sparklines
export type VendorRow = { id: string; name: string; region: string; rating: number; trend: Spark; pct: number };
export type QuoteRow  = { id: string; sku: string; vendor: string; price: number; currency: string; trend: Spark; pct: number };

function spark(n=12): Spark {
  const arr: number[] = [];
  let v = Math.random() * 0.6 + 0.2;
  for (let i=0;i<n;i++) { v = Math.min(1, Math.max(0, v + (Math.random()-0.5)*0.2)); arr.push(v); }
  return arr;
}

export async function getRecentVendorsRowsMock(): Promise<VendorRow[]> {
  return [
    { id:'v1', name:'VN-Textiles 23', region:'Vietnam', rating:4.7, trend:spark(), pct:+3.17 },
    { id:'v2', name:'PT Knit Mills',  region:'India',   rating:4.5, trend:spark(), pct:+2.74 },
    { id:'v3', name:'BD Garments 8',  region:'Bangladesh', rating:4.3, trend:spark(), pct:+4.21 },
  ];
}

export async function getRecentQuotesRowsMock(): Promise<QuoteRow[]> {
  return [
    { id:'q1', sku:'HOODIE-400GSM-BLK', vendor:'PT Knit Mills', price:8.5, currency:'USD', trend:spark(), pct:+1.50 },
    { id:'q2', sku:'TEE-240GSM-WHT',    vendor:'VN-Textiles 23', price:2.1, currency:'USD', trend:spark(), pct:+0.92 },
  ];
}