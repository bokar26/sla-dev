import React, { useState, useEffect } from 'react';
import { CardGlass } from '../user/components/UiKit';
import SleekButton from './ui/SleekButton';
import { 
  FileText, 
  Plus, 
  Search, 
  MapPin, 
  Package, 
  DollarSign, 
  Eye, 
  Download, 
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const CustomQuotation = () => {
  // Form state
  const [quotationForm, setQuotationForm] = useState({
    productName: '',
    description: '',
    quantity: '',
    unitPrice: '',
    specifications: '',
    materials: '',
    finish: '',
    packaging: '',
    deliveryTime: '',
    location: ''
  });

  // Results state
  const [matchedFactories, setMatchedFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProforma, setShowProforma] = useState(false);
  const [selectedProformaFactory, setSelectedProformaFactory] = useState(null);
  const [proformaData, setProformaData] = useState(null);
  const [isProformaLoading, setIsProformaLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState('idle');
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('quotation');

  // Helper: snapshot of inputs that affect pricing, to decide when to invalidate cached proforma
  const quoteKey = JSON.stringify({
    productName: quotationForm.productName?.trim(),
    description: quotationForm.description?.trim(),
    quantity: quotationForm.quantity,
    unitPrice: quotationForm.unitPrice,
    specifications: quotationForm.specifications?.trim(),
    materials: quotationForm.materials?.trim(),
    finish: quotationForm.finish?.trim(),
    packaging: quotationForm.packaging?.trim(),
    deliveryTime: quotationForm.deliveryTime?.trim(),
    location: quotationForm.location?.trim()
  });

  // Load saved invoices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedInvoices');
    if (saved) {
      setSavedInvoices(JSON.parse(saved));
    }
  }, []);

  // Save invoices to localStorage
  const saveInvoices = (invoices) => {
    localStorage.setItem('savedInvoices', JSON.stringify(invoices));
    setSavedInvoices(invoices);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuotationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const findMatchingFactories = async () => {
    setIsLoading(true);
    setMatchedFactories([]);
    setShowProforma(false);
    
    try {
      const response = await fetch('http://localhost:8000/api/factories/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: quotationForm.productName,
          description: quotationForm.description,
          specifications: quotationForm.specifications,
          materials: quotationForm.materials,
          quantity: parseInt(quotationForm.quantity) || 1000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatchedFactories(data.factories || []);
      } else {
        console.error('Failed to search factories');
      }
    } catch (error) {
      console.error('Error searching factories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateQuoteInstantly = (factory) => {
    const basePrice = parseFloat(quotationForm.unitPrice) || 0;
    const quantity = parseInt(quotationForm.quantity) || 1000;
    
    // Simple pricing logic
    let unitPrice = basePrice;
    if (quantity >= 10000) unitPrice *= 0.85; // 15% discount for large orders
    else if (quantity >= 5000) unitPrice *= 0.90; // 10% discount
    else if (quantity >= 1000) unitPrice *= 0.95; // 5% discount
    
    const total = unitPrice * quantity;
    
    return {
      invoiceNumber: `INV-${Date.now()}`,
      productName: quotationForm.productName,
      description: quotationForm.description,
      quantity: quantity,
      unitPrice: unitPrice,
      total: total,
      factory: factory,
      specifications: quotationForm.specifications,
      materials: quotationForm.materials,
      finish: quotationForm.finish,
      packaging: quotationForm.packaging,
      deliveryTime: quotationForm.deliveryTime || '4-6 weeks',
      location: quotationForm.location
    };
  };

  const viewProforma = (factory) => {
    setSelectedProformaFactory(factory);
    setLlmStatus('calculating');
    
    // Use instant calculation instead of LLM
    setTimeout(() => {
      const proforma = calculateQuoteInstantly(factory);
      setProformaData(proforma);
      setShowProforma(true);
      setLlmStatus('done');
    }, 500);
  };

  const saveInvoice = () => {
    if (proformaData && selectedProformaFactory) {
      const newInvoice = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        invoiceData: proformaData,
        factory: selectedProformaFactory
      };
      
      const updatedInvoices = [...savedInvoices, newInvoice];
      saveInvoices(updatedInvoices);
      alert('Invoice saved successfully!');
    }
  };

  const deleteSavedInvoice = (id) => {
    const updatedInvoices = savedInvoices.filter(invoice => invoice.id !== id);
    saveInvoices(updatedInvoices);
  };

  const resetForm = () => {
    setQuotationForm({
      productName: '',
      description: '',
      quantity: '',
      unitPrice: '',
      specifications: '',
      materials: '',
      finish: '',
      packaging: '',
      deliveryTime: '',
      location: ''
    });
    setMatchedFactories([]);
    setShowProforma(false);
    setProformaData(null);
    setSelectedProformaFactory(null);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-muted rounded-xl">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Custom Quotation</h1>
          </div>
          <p className="text-muted-foreground">Create custom quotations for your products using saved factories or find new suppliers</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('quotation')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-smooth ${
                activeTab === 'quotation'
                  ? 'bg-card text-emerald-600 shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Quotation
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-smooth ${
                activeTab === 'saved'
                  ? 'bg-card text-emerald-600 shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Invoices ({savedInvoices.length})
            </button>
          </div>
        </div>

        {activeTab === 'quotation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Requirements Form */}
            <CardGlass className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Product Requirements
              </h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                findMatchingFactories();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={quotationForm.productName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                    placeholder="e.g., Smartphone Case, LED Bulb"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={quotationForm.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                    rows="3"
                    placeholder="Detailed product description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={quotationForm.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="1000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="unitPrice"
                      value={quotationForm.unitPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Specifications
                  </label>
                  <textarea
                    name="specifications"
                    value={quotationForm.specifications}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                    rows="2"
                    placeholder="Technical specifications, dimensions, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Materials
                    </label>
                    <input
                      type="text"
                      name="materials"
                      value={quotationForm.materials}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="e.g., ABS Plastic, Aluminum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Finish
                    </label>
                    <input
                      type="text"
                      name="finish"
                      value={quotationForm.finish}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="e.g., Matte, Glossy, Anodized"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Packaging Requirements
                  </label>
                  <input
                    type="text"
                    name="packaging"
                    value={quotationForm.packaging}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                    placeholder="e.g., Individual boxes, Bulk packaging"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="text"
                      name="deliveryTime"
                      value={quotationForm.deliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="e.g., 4-6 weeks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={quotationForm.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ease-smooth"
                      placeholder="e.g., New York, USA"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <SleekButton
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Finding Factories...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Find & Quote
                      </>
                    )}
                  </SleekButton>
                  <SleekButton
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Reset
                  </SleekButton>
                </div>
              </form>
            </CardGlass>

            {/* Invoice/Results Panel */}
            <CardGlass className="p-6">
              {!matchedFactories.length && !showProforma ? (
                /* Blank Invoice */
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    ProForma Invoice
                  </h3>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2 text-foreground">No Invoice Generated</p>
                      <p className="text-sm">Fill out the product requirements and click "Find & Quote" to generate a proforma invoice</p>
                    </div>
                  </div>
                </div>
              ) : showProforma && proformaData ? (
                /* ProForma Invoice */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      ProForma Invoice
                    </h3>
                    <div className="flex gap-2">
                      <SleekButton
                        variant="outline"
                        onClick={saveInvoice}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Save Invoice
                      </SleekButton>
                      <SleekButton
                        variant="outline"
                        onClick={() => setShowProforma(false)}
                      >
                        <X className="w-4 h-4" />
                      </SleekButton>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Invoice #:</span>
                        <span className="ml-2 font-medium text-foreground">{proformaData.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 font-medium text-foreground">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Product Details</h4>
                      <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Product:</span> <span className="font-medium text-foreground">{proformaData.productName}</span></div>
                        <div><span className="text-muted-foreground">Description:</span> <span className="font-medium text-foreground">{proformaData.description}</span></div>
                        <div><span className="text-muted-foreground">Specifications:</span> <span className="font-medium text-foreground">{proformaData.specifications}</span></div>
                        <div><span className="text-muted-foreground">Materials:</span> <span className="font-medium text-foreground">{proformaData.materials}</span></div>
                        <div><span className="text-muted-foreground">Finish:</span> <span className="font-medium text-foreground">{proformaData.finish}</span></div>
                        <div><span className="text-muted-foreground">Packaging:</span> <span className="font-medium text-foreground">{proformaData.packaging}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Factory Information</h4>
                      <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Factory:</span> <span className="font-medium text-foreground">{proformaData.factory.name}</span></div>
                        <div><span className="text-muted-foreground">Location:</span> <span className="font-medium text-foreground">{proformaData.factory.location}</span></div>
                        <div><span className="text-muted-foreground">Specialties:</span> <span className="font-medium text-foreground">{proformaData.factory.specialties?.join(', ')}</span></div>
                        <div><span className="text-muted-foreground">Delivery Time:</span> <span className="font-medium text-foreground">{proformaData.deliveryTime}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Pricing</h4>
                      <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span className="font-medium text-foreground">{proformaData.quantity.toLocaleString()} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unit Price:</span>
                          <span className="font-medium text-foreground">${proformaData.unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 font-semibold">
                          <span className="text-foreground">Total:</span>
                          <span className="text-foreground">${proformaData.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Factory Results */
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Search className="w-5 h-5 text-emerald-600" />
                    Matching Factories ({matchedFactories.length})
                  </h3>

                  {matchedFactories.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No matching factories found</p>
                      <SleekButton
                        variant="outline"
                        onClick={() => setMatchedFactories([])}
                      >
                        <Plus className="w-4 h-4" />
                        Find New Factory
                      </SleekButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchedFactories.map((factory, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 hover:shadow-soft transition-all duration-200 ease-smooth">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">{factory.name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {factory.location}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium text-foreground">{factory.rating}</span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-2">Specialties:</p>
                            <div className="flex flex-wrap gap-1">
                              {factory.specialties?.map((specialty, idx) => (
                                <span key={idx} className="px-2 py-1 bg-muted text-foreground text-xs rounded-full">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <SleekButton
                              variant="primary"
                              onClick={() => viewProforma(factory)}
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View ProForma
                            </SleekButton>
                            <SleekButton
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(factory, null, 2));
                                alert('Factory details copied to clipboard!');
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </SleekButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardGlass>
          </div>
        ) : (
          /* Saved Invoices Tab */
          <div className="space-y-6">
            {savedInvoices.length === 0 ? (
              <CardGlass className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Saved Invoices</h3>
                <p className="text-muted-foreground mb-4">Create and save invoices to see them here</p>
                <SleekButton
                  variant="primary"
                  onClick={() => setActiveTab('quotation')}
                >
                  Create New Quotation
                </SleekButton>
              </CardGlass>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {savedInvoices.map((invoice) => (
                  <CardGlass key={invoice.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{invoice.invoiceData.productName}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.invoiceData.factory.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(invoice.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteSavedInvoice(invoice.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-foreground">{invoice.invoiceData.quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span className="font-medium text-foreground">${invoice.invoiceData.unitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-border pt-2">
                        <span className="text-foreground">Total:</span>
                        <span className="text-foreground">${invoice.invoiceData.total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <SleekButton
                        variant="primary"
                        onClick={() => {
                          setProformaData(invoice.invoiceData);
                          setSelectedProformaFactory(invoice.factory);
                          setShowProforma(true);
                          setActiveTab('quotation');
                        }}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </SleekButton>
                      <SleekButton
                        variant="outline"
                        onClick={() => {
                          const invoiceText = `Invoice #${invoice.invoiceData.invoiceNumber}\nProduct: ${invoice.invoiceData.productName}\nFactory: ${invoice.invoiceData.factory.name}\nTotal: $${invoice.invoiceData.total.toFixed(2)}`;
                          navigator.clipboard.writeText(invoiceText);
                          alert('Invoice details copied to clipboard!');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </SleekButton>
                    </div>
                  </CardGlass>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomQuotation;