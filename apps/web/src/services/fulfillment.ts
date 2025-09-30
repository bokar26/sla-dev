// Fulfillment service for managing quotes, shipping routes, and invoices
import { get, post } from "@/lib/http";

export interface RoutePlanRequest {
  origin: string;
  destination: string;
  freightType: 'air' | 'sea' | 'land';
  speed: 'standard' | 'express' | 'overnight';
  weight: number;
  weightUnit: 'kg' | 'lb';
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  pieces?: number;
  packaging?: string;
}

export interface RouteOption {
  id: string;
  carrier: string;
  service: string;
  estimatedDays: number;
  cost: number;
  currency: string;
  features: string[];
}

export interface RoutePlanResponse {
  routes: RouteOption[];
  volumetricWeight?: number;
  cbm?: number;
}

export interface ShippingRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  carrier: string;
  estimatedDays: number;
  cost: number;
  currency: string;
  serviceType: 'standard' | 'express' | 'overnight';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
}

export interface Invoice {
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
}

export interface CreateInvoiceRequest {
  quoteId: string;
  shippingRouteId: string;
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
  notes?: string;
}

// Route Planning API
export async function planRoute(request: RoutePlanRequest): Promise<RoutePlanResponse> {
  return post("/api/fulfillment/plan-route", request);
}

// Shipping Routes API
export async function getShippingRoutes(): Promise<ShippingRoute[]> {
  try {
    const data = await get("/api/shipping-routes");
    return data.routes || [];
  } catch (error) {
    console.error('Error fetching shipping routes:', error);
    return [];
  }
}

// Invoices API
export async function createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
  return post("/api/invoices", request);
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const data = await get("/api/invoices");
    return data.invoices || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  return get(`/api/invoices/${invoiceId}`);
}

// PDF Generation (placeholder - would integrate with actual PDF service)
export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  try {
    // In a real implementation, this would call a PDF generation service
    // For now, we'll create a simple text-based "PDF"
    const pdfContent = `
INVOICE #${invoice.invoiceNumber}
Date: ${invoice.date}
Due Date: ${invoice.dueDate}

Bill To:
${invoice.billTo.name}
${invoice.billTo.address}
${invoice.billTo.city}, ${invoice.billTo.country}

Ship To:
${invoice.shipTo.name}
${invoice.shipTo.address}
${invoice.shipTo.city}, ${invoice.shipTo.country}

Items:
${invoice.items.map(item => 
  `${item.description} - Qty: ${item.quantity} × $${item.unitPrice} = $${item.total}`
).join('\n')}

Subtotal: $${invoice.subtotal}
Tax: $${invoice.tax}
Shipping: $${invoice.shipping}
Total: $${invoice.total} ${invoice.currency}

Terms: ${invoice.terms}
${invoice.notes ? `Notes: ${invoice.notes}` : ''}
    `;

    return new Blob([pdfContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Download invoice as PDF
export function downloadInvoicePDF(invoice: Invoice): void {
  generateInvoicePDF(invoice)
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    });
}
