export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'INR' | string;

export interface Supplier {
  id: string;
  name: string;
  country: string;
  region: string; // e.g., APAC, EMEA, AMER
  currency?: Currency;
}

export interface Sku {
  id: string;
  code: string;
  title: string;
  category?: string;
}

export interface SupplierSku {
  supplierId: string;
  skuId: string;
  cost: number;       // supplier unit cost
  price?: number;     // sell/transfer price if available
  moq?: number;
  leadTimeDays?: number;
}

export interface SkuSales {
  skuId: string;
  units: number;
  revenue: number;    // realized revenue in base currency
  periodStart: string; // ISO
  periodEnd: string;   // ISO
}

export interface PortfolioOverview {
  totalRevenue: number;
  totalCogs: number;
  grossMargin: number;     // $ GM
  grossMarginPct: number;  // GM%
  suppliers: number;
  skus: number;
  regionMix: { region: string; revenue: number; gm: number }[];
}

export interface SupplierRow {
  supplier: Supplier;
  revenue: number;
  cogs: number;
  gm: number;
  gmPct: number;
  skus: number;
  topSkus: { skuId: string; title: string; revenue: number; gmPct: number }[];
}

export interface FactorySuggestion {
  factoryId: string;
  name: string;
  region: string;
  country: string;
  score: number;
  rationale: string;
}

export interface PortfolioFilters {
  from?: string;
  to?: string;
  region?: string;
  search?: string;
}

export interface SupplierDetail {
  supplier: Supplier;
  skus: {
    sku: Sku;
    supplierSku: SupplierSku;
    sales?: SkuSales;
    revenue: number;
    cogs: number;
    gm: number;
    gmPct: number;
  }[];
  totalRevenue: number;
  totalCogs: number;
  totalGm: number;
  totalGmPct: number;
}
