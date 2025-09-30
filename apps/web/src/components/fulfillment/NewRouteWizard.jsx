import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Package, Truck, Ship, Plane, MapPin } from 'lucide-react';
import { useSavedQuotes } from '../../hooks/useSavedQuotes';
import { calculateShipmentMetrics } from '../../utils/shipCalc';
import { recommendRoutes } from '../../services/routes';
import { planRoute } from '../../services/fulfillmentService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import ManualShipmentForm from './ManualShipmentForm';

const NewRouteWizard = ({ open, onOpenChange, onComplete }) => {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'manual'
  
  // Saved tab state (existing)
  const [sourceType, setSourceType] = useState('quote'); // 'quote' | 'vendor'
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [destination, setDestination] = useState('');
  const [freightMode, setFreightMode] = useState('air');
  const [speedPref, setSpeedPref] = useState('balanced');
  const [customItems, setCustomItems] = useState([]);
  
  // Manual tab state (new)
  const [manualFormData, setManualFormData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data hooks
  const { data: quotes, loading: quotesLoading } = useSavedQuotes(100);
  
  // Mock vendors data (replace with real hook when available)
  const vendors = [
    { id: 'v1', name: 'Shenzhen Textile Co.', location: 'Shenzhen, China' },
    { id: 'v2', name: 'Guangzhou Manufacturing Ltd.', location: 'Guangzhou, China' },
    { id: 'v3', name: 'Dongguan Factory Complex', location: 'Dongguan, China' }
  ];

  const selectedQuote = useMemo(() => 
    quotes.find(q => q.id === selectedQuoteId), 
    [quotes, selectedQuoteId]
  );

  const selectedVendor = useMemo(() => 
    vendors.find(v => v.id === selectedVendorId), 
    [vendors, selectedVendorId]
  );

  const origin = useMemo(() => {
    if (sourceType === 'quote' && selectedQuote) {
      return {
        city: selectedQuote.origin_city,
        country: selectedQuote.origin_country_iso2,
        portCode: selectedQuote.origin_port_code
      };
    }
    if (sourceType === 'vendor' && selectedVendor) {
      return {
        city: selectedVendor.location.split(',')[0],
        country: selectedVendor.location.split(',')[1]?.trim() || 'China',
        portCode: null
      };
    }
    return null;
  }, [sourceType, selectedQuote, selectedVendor]);

  const canProceed = useMemo(() => {
    if (activeTab === 'manual') {
      // For manual tab, we don't use steps - the form handles validation
      return false; // Manual form handles its own submit
    }
    
    if (step === 1) {
      return sourceType === 'quote' ? selectedQuoteId : selectedVendorId;
    }
    if (step === 2) {
      return destination.trim() && freightMode && speedPref;
    }
    if (step === 3) {
      if (sourceType === 'quote' && selectedQuote) {
        return selectedQuote.weight_kg && selectedQuote.volume_cbm;
      }
      if (sourceType === 'vendor') {
        return customItems.length > 0 && customItems.every(item => 
          item.qty > 0 && item.unit_weight_kg > 0 && 
          item.unit_dims_cm && item.unit_dims_cm.length === 3
        );
      }
      return false;
    }
    return false;
  }, [activeTab, step, sourceType, selectedQuoteId, selectedVendorId, destination, freightMode, speedPref, selectedQuote, customItems]);

  const handleManualSubmit = async (manualData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await planRoute(manualData);
      onComplete(result);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to get route recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 3) {
      // Calculate metrics and call SLA for saved tab
      setLoading(true);
      setError(null);
      
      try {
        let metrics;
        if (sourceType === 'quote' && selectedQuote) {
          metrics = {
            totalWeightKg: selectedQuote.weight_kg || 0,
            totalVolumeCbm: selectedQuote.volume_cbm || 0,
            chargeableAirKg: selectedQuote.weight_kg || 0,
            seaWmTon: Math.max((selectedQuote.weight_kg || 0) / 1000, selectedQuote.volume_cbm || 0)
          };
        } else {
          const calculated = calculateShipmentMetrics(customItems);
          metrics = {
            totalWeightKg: calculated.totalWeightKg,
            totalVolumeCbm: calculated.totalVolumeCbm,
            chargeableAirKg: calculated.chargeableAirKg,
            seaWmTon: calculated.seaWmTon
          };
        }

        const request = {
          mode: "saved",
          shipment: {
            origin: {
              type: "location",
              city: origin.city,
              country: origin.country,
              portCode: origin.portCode
            },
            destination: {
              type: "location", 
              city: destination.split(',')[0]?.trim(),
              country: destination.split(',')[1]?.trim() || 'USA',
              portCode: null
            },
            freightType: freightMode,
            speed: speedPref,
            weightKg: metrics.totalWeightKg,
            dimensionsCm: metrics.totalVolumeCbm ? {
              lengthCm: Math.cbrt(metrics.totalVolumeCbm * 1000000),
              widthCm: Math.cbrt(metrics.totalVolumeCbm * 1000000),
              heightCm: Math.cbrt(metrics.totalVolumeCbm * 1000000),
              pieces: 1
            } : undefined,
            volWeightKg: metrics.chargeableAirKg,
            cbm: metrics.totalVolumeCbm,
            packaging: "carton"
          },
          quoteId: sourceType === 'quote' ? selectedQuoteId : undefined,
          vendorId: sourceType === 'vendor' ? selectedVendorId : undefined
        };

        const result = await planRoute(request);
        onComplete(result);
        onOpenChange(false);
      } catch (err) {
        setError(err.message || 'Failed to get route recommendations');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, {
      id: Date.now().toString(),
      sku: '',
      qty: 1,
      unit_weight_kg: 0,
      unit_dims_cm: [0, 0, 0]
    }]);
  };

  const updateCustomItem = (id, field, value) => {
    setCustomItems(items => items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeCustomItem = (id) => {
    setCustomItems(items => items.filter(item => item.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New Route</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Step {step} of 3</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <Tabs activeValue={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="saved" activeValue={activeTab} onValueChange={setActiveTab}>
                <Package className="w-4 h-4 mr-2" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="manual" activeValue={activeTab} onValueChange={setActiveTab}>
                <MapPin className="w-4 h-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Progress - only show for saved tab */}
        {activeTab === 'saved' && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-0.5 ${
                    stepNum < step ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'manual' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Manual Shipment Entry
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Enter origin, destination, weight, and dimensions to find the best routes.
                </p>
                <ManualShipmentForm 
                  onSubmit={handleManualSubmit}
                  loading={loading}
                />
              </div>
            </div>
          ) : step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Choose Shipment Source
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setSourceType('quote')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      sourceType === 'quote'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Package className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                    <div className="font-medium">Use Saved Quote</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Pre-filled origin & metrics
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSourceType('vendor')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      sourceType === 'vendor'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                    <div className="font-medium">Use Saved Vendor</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Add item details manually
                    </div>
                  </button>
                </div>

                {sourceType === 'quote' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Select Quote
                    </label>
                    <select
                      value={selectedQuoteId}
                      onChange={(e) => setSelectedQuoteId(e.target.value)}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Choose a quote...</option>
                      {quotes.map(quote => (
                        <option key={quote.id} value={quote.id}>
                          {quote.vendor_name} - {quote.product} ({quote.ref})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sourceType === 'vendor' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Select Vendor
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Choose a vendor...</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} - {vendor.location}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Destination & Preferences
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="City, Country or Port code"
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Freight Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'air', label: 'Air', icon: Plane },
                        { value: 'sea', label: 'Sea', icon: Ship },
                        { value: 'truck', label: 'Truck', icon: Truck }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setFreightMode(value)}
                          className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                            freightMode === value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Speed Preference
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'fastest', label: 'Fastest' },
                        { value: 'balanced', label: 'Balanced' },
                        { value: 'cheapest', label: 'Cheapest' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setSpeedPref(value)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            speedPref === value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Shipment Details
                </h3>
                
                {sourceType === 'quote' && selectedQuote ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Quote Details
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <div>Weight: {selectedQuote.weight_kg || 'Not specified'} kg</div>
                        <div>Volume: {selectedQuote.volume_cbm || 'Not specified'} cbm</div>
                      </div>
                    </div>
                    
                    {(!selectedQuote.weight_kg || !selectedQuote.volume_cbm) && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          Missing weight or volume data. Please add item details below.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {sourceType === 'vendor' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Item Details
                      </h4>
                      <button
                        onClick={addCustomItem}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        + Add Item
                      </button>
                    </div>
                    
                    {customItems.map((item, index) => (
                      <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          <button
                            onClick={() => removeCustomItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">SKU</label>
                            <input
                              type="text"
                              value={item.sku}
                              onChange={(e) => updateCustomItem(item.id, 'sku', e.target.value)}
                              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateCustomItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Weight (kg)</label>
                            <input
                              type="number"
                              value={item.unit_weight_kg}
                              onChange={(e) => updateCustomItem(item.id, 'unit_weight_kg', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Dimensions (L×W×H cm)</label>
                            <div className="flex gap-1">
                              {[0, 1, 2].map(i => (
                                <input
                                  key={i}
                                  type="number"
                                  value={item.unit_dims_cm[i]}
                                  onChange={(e) => {
                                    const newDims = [...item.unit_dims_cm];
                                    newDims[i] = parseFloat(e.target.value) || 0;
                                    updateCustomItem(item.id, 'unit_dims_cm', newDims);
                                  }}
                                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          )}
        </div>

        {/* Footer - only show for saved tab */}
        {activeTab === 'saved' && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : step === 3 ? (
                'Get Routes'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRouteWizard;
