import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Download, 
  Clock, 
  MapPin,
  ArrowRight,
  FileText
} from 'lucide-react';
import type { Quote, ShippingRoute, Invoice, FulfillmentOrder } from '../types/quote';
import { getShippingRoutes, createInvoice, downloadInvoicePDF } from '@/services/fulfillment';
import { getQuotes } from '@/services/quotes';
import IncotermsForm from './fulfillment/IncotermsForm';
import ShippingWizard from '@/features/fulfillment/ShippingWizard';

// Mock data for demonstration
const mockQuotes = [
  {
    id: 'QUOTE-001',
    factoryId: 'FACTORY-001',
    factoryName: 'Shenzhen Textile Co.',
    status: 'saved',
    input: {
      productName: 'Cotton T-Shirts',
      quantity: 1000,
      targetUnitCost: 5.50
    },
    calc: {
      unitCost: 5.50,
      subtotal: 5500,
      tax: 550,
      total: 6050,
      currency: 'USD',
      deliveryTime: '15-20 days',
      invoiceNumber: 'INV-001'
    },
    createdAt: '2024-01-15T10:00:00Z',
    source: 'internal'
  },
  {
    id: 'QUOTE-002',
    factoryId: 'FACTORY-002',
    factoryName: 'Guangzhou Manufacturing Ltd.',
    status: 'saved',
    input: {
      productName: 'Denim Jeans',
      quantity: 500,
      targetUnitCost: 12.00
    },
    calc: {
      unitCost: 12.00,
      subtotal: 6000,
      tax: 600,
      total: 6600,
      currency: 'USD',
      deliveryTime: '20-25 days',
      invoiceNumber: 'INV-002'
    },
    createdAt: '2024-01-16T14:30:00Z',
    source: 'alibaba'
  }
];

const mockShippingRoutes = [
  {
    id: 'ROUTE-001',
    name: 'Standard Sea Freight',
    from: 'Shenzhen, China',
    to: 'Los Angeles, USA',
    carrier: 'COSCO Shipping',
    estimatedDays: 18,
    cost: 450,
    currency: 'USD',
    serviceType: 'standard'
  },
  {
    id: 'ROUTE-002',
    name: 'Express Air Freight',
    from: 'Guangzhou, China',
    to: 'New York, USA',
    carrier: 'DHL Express',
    estimatedDays: 5,
    cost: 1200,
    currency: 'USD',
    serviceType: 'express'
  },
  {
    id: 'ROUTE-003',
    name: 'Economy Sea Freight',
    from: 'Shanghai, China',
    to: 'Miami, USA',
    carrier: 'Maersk',
    estimatedDays: 22,
    cost: 380,
    currency: 'USD',
    serviceType: 'standard'
  }
];

const Fulfillment = () => {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Route, 2: Create Invoice, 3: Review
  const [quotes, setQuotes] = useState([]);
  const [shippingRoutes, setShippingRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [quotesData, routesData] = await Promise.all([
          getQuotes(),
          getShippingRoutes()
        ]);
        setQuotes(quotesData);
        setShippingRoutes(routesData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading fulfillment data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleQuoteSelect = (quote) => {
    setSelectedQuote(quote);
    setStep(1);
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setStep(2);
  };

  const generateInvoice = async () => {
    if (!selectedQuote || !selectedRoute) return;

    try {
      const invoiceRequest = {
        quoteId: selectedQuote.id,
        shippingRouteId: selectedRoute.id,
        billTo: {
          name: 'Your Company Name',
          address: '123 Business St',
          city: 'New York',
          country: 'USA',
          email: 'billing@yourcompany.com'
        },
        shipTo: {
          name: 'Your Company Name',
          address: '123 Business St',
          city: 'New York',
          country: 'USA'
        },
        notes: 'Generated from fulfillment system'
      };

      const newInvoice = await createInvoice(invoiceRequest);
      setInvoice(newInvoice);
      setStep(3);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  const downloadInvoice = () => {
    if (invoice) {
      downloadInvoicePDF(invoice);
    }
  };

  const resetFlow = () => {
    setSelectedQuote(null);
    setSelectedRoute(null);
    setInvoice(null);
    setStep(0);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading fulfillment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Package size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fulfillment Management</h1>
          <p className="text-gray-600">Select saved quotes, choose shipping routes, and generate invoices</p>
        </div>

        {/* Progress Steps - Horizontal Scrollable */}
        <div className="mb-8">
          <div className="overflow-x-auto">
            <div className="flex items-center min-w-max space-x-4 pb-4">
              {[
                { step: 1, title: 'Choose Route', icon: <Truck size={20} /> },
                { step: 2, title: 'Create Invoice', icon: <Package size={20} /> },
                { step: 3, title: 'Review & Download', icon: <Download size={20} /> }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    step >= item.step 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`ml-3 text-sm font-medium whitespace-nowrap ${
                    step >= item.step ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.title}
                  </span>
                  {index < 2 && (
                    <ArrowRight className="mx-6 text-gray-300 flex-shrink-0" size={16} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New Shipping Wizard */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Truck className="text-emerald-600" size={16} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">AI Shipping Planner</h2>
            </div>
            <ShippingWizard />
          </div>
        </section>


        {/* Step 1: Select Shipping Route */}
        {step === 1 && selectedQuote && (
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Truck className="text-green-600" size={16} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Choose Shipping Route</h2>
                  </div>
              <button
                onClick={() => setStep(0)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Shipping Planner
              </button>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedQuote.factoryName}</h3>
              <p className="text-gray-600">{selectedQuote.input.productName} • {selectedQuote.input.quantity.toLocaleString()} units</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {shippingRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          route.serviceType === 'express' 
                            ? 'bg-red-100 text-red-700'
                            : route.serviceType === 'overnight'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {route.serviceType}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {route.from} → {route.to}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck size={16} />
                          {route.carrier}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {route.estimatedDays} days
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${route.cost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {route.currency}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={generateInvoice}
                disabled={!selectedRoute}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
          </section>
        )}

        {/* Incoterms Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="text-blue-600" size={16} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Incoterms Configuration</h2>
              </div>
            </div>
            
            <div className="p-6">
              <IncotermsForm onPlan={(res) => console.debug("Incoterm plan", res)} />
            </div>
          </div>
        </section>

        {/* Step 2: Create Invoice */}
        {step === 2 && selectedQuote && selectedRoute && (
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Package className="text-purple-600" size={16} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Create Invoice</h2>
                  </div>
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Routes
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <Package className="mx-auto text-blue-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Invoice...</h3>
              <p className="text-gray-500 mb-6">Creating invoice with selected quote and shipping route.</p>
              <button
                onClick={generateInvoice}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
          </section>
        )}

        {/* Step 3: Review & Download Invoice */}
        {step === 3 && invoice && (
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Download className="text-orange-600" size={16} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Invoice Generated</h2>
                  </div>
              <button
                onClick={resetFlow}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create New Invoice
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Invoice Preview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">INVOICE</h3>
                  <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Date: {invoice.date}</p>
                  <p className="text-gray-600">Due: {invoice.dueDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                  <p className="text-gray-600">{invoice.billTo.name}</p>
                  <p className="text-gray-600">{invoice.billTo.address}</p>
                  <p className="text-gray-600">{invoice.billTo.city}, {invoice.billTo.country}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ship To:</h4>
                  <p className="text-gray-600">{invoice.shipTo.name}</p>
                  <p className="text-gray-600">{invoice.shipTo.address}</p>
                  <p className="text-gray-600">{invoice.shipTo.city}, {invoice.shipTo.country}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Items:</h4>
                <div className="space-y-2">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitPrice}</p>
                      </div>
                      <p className="font-semibold text-gray-900">${item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">${invoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">${invoice.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="text-gray-900">${invoice.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${invoice.total.toLocaleString()} {invoice.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Edit Invoice
              </button>
              <button
                onClick={downloadInvoice}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Fulfillment;
