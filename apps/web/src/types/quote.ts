export type QuoteInput = {
  productName: string;
  description?: string;
  quantity: number;
  specifications?: Record<string, string | number>;
  materials?: Array<{ name: string; gsm?: number; blend?: string; percent?: number }>;
  targetUnitCost?: number;
  incoterm?: 'EXW'|'FOB'|'CIF'|'DDP';
  shipFrom?: string;
  shipTo?: string;
  desiredLeadTimeDays?: number;
  packaging?: string;
  sizes?: Array<{ label: string; qty: number }>;
  notes?: string;
  region?: string;
  targetPrice?: number;
};

export type QuoteCalc = {
  unitCost: number;
  toolingCost?: number;
  freightEstimate?: number;
  tariffEstimate?: number;
  moqAdjustment?: number;
  marginEstimate?: number;
  currency: string;
  breakdown: Array<{ label: string; value: number }>;
  subtotal: number;
  tax: number;
  total: number;
  deliveryTime: string;
  terms: string;
  validity: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  notes?: string;
};

export type Quote = {
  id: string;
  factoryId: string;
  factoryName: string;
  status: 'draft'|'generated'|'saved';
  input: QuoteInput;
  calc?: QuoteCalc;
  createdAt: string;
  updatedAt: string;
  // Alibaba integration metadata
  source?: 'internal' | 'alibaba';
  sourceId?: string;
  storefrontUrl?: string;
};

export type QuoteState = 'idle' | 'calculating' | 'generated' | 'dirty';

// Fulfillment and Invoice types
export type ShippingRoute = {
  id: string;
  name: string;
  from: string;
  to: string;
  carrier: string;
  estimatedDays: number;
  cost: number;
  currency: string;
  serviceType: 'standard' | 'express' | 'overnight';
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
};

export type Invoice = {
  id: string;
  quoteId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billTo: {
    name: string;
    address: string;
    city: string;
    country: string;
    email?: string;
  };
  shipTo: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  terms: string;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
};

export type FulfillmentOrder = {
  id: string;
  quoteId: string;
  quote: Quote;
  shippingRoute?: ShippingRoute;
  invoice?: Invoice;
  status: 'pending' | 'in_progress' | 'shipped' | 'delivered' | 'completed';
  createdAt: string;
  updatedAt: string;
};

// Re-export from fulfillment.ts for convenience
export type { FulfillmentOrder as FulfillmentOrderDetailed } from './fulfillment';
