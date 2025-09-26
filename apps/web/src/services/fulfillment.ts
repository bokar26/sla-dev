// Fulfillment service for managing quotes, shipping routes, and invoices

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

// Shipping Routes API
export async function getShippingRoutes(): Promise<ShippingRoute[]> {
  try {
    const response = await fetch('http://localhost:8000/api/shipping-routes');
    if (!response.ok) {
      throw new Error('Failed to fetch shipping routes');
    }
    const data = await response.json();
    return data.routes;
  } catch (error) {
    console.error('Error fetching shipping routes:', error);
    throw error;
  }
}

// Invoices API
export async function createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
  try {
    const response = await fetch('http://localhost:8000/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const response = await fetch('http://localhost:8000/api/invoices');
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    const data = await response.json();
    return data.invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  try {
    const response = await fetch(`http://localhost:8000/api/invoices/${invoiceId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
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
