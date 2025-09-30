import React, { useState, useMemo } from 'react';
import { useSavedQuotes } from '../../hooks/useSavedQuotes';
import { planRoute } from '../../services/fulfillmentService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

export type PlanRouteInput = {
  mode: "saved_quote" | "saved_vendor" | "manual";
  // When mode === saved_quote
  savedQuoteId?: string;
  // When mode === saved_vendor
  vendorId?: string;
  destination?: string;
  freightType?: "air" | "sea" | "truck";
  speed?: "economy" | "standard" | "express";
  // Manual fields
  origin?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
};

interface NewRouteFormProps {
  onSubmit: (input: PlanRouteInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<PlanRouteInput>;
}

export default function NewRouteForm({
  onSubmit,
  isSubmitting = false,
  defaultValues
}: NewRouteFormProps) {
  const [mode, setMode] = useState<'saved' | 'manual'>('saved');
  
  // Saved tab state
  const [sourceType, setSourceType] = useState<'quote' | 'vendor'>('quote');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [destination, setDestination] = useState('');
  const [freightMode, setFreightMode] = useState<'air' | 'sea' | 'truck'>('air');
  const [speedPref, setSpeedPref] = useState<'economy' | 'standard' | 'express'>('standard');
  
  // Manual entry state
  const [manualOrigin, setManualOrigin] = useState('');
  const [manualDestination, setManualDestination] = useState('');
  const [manualWeight, setManualWeight] = useState(0);
  const [manualLength, setManualLength] = useState(0);
  const [manualWidth, setManualWidth] = useState(0);
  const [manualHeight, setManualHeight] = useState(0);
  const [manualFreightType, setManualFreightType] = useState<'air' | 'sea' | 'truck'>('air');
  const [manualSpeed, setManualSpeed] = useState<'economy' | 'standard' | 'express'>('standard');

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

  const handleSavedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sourceType === 'quote' && !selectedQuoteId) return;
    if (sourceType === 'vendor' && (!selectedVendorId || !destination.trim())) return;
    
    const input: PlanRouteInput = {
      mode: sourceType === 'quote' ? 'saved_quote' : 'saved_vendor',
      savedQuoteId: sourceType === 'quote' ? selectedQuoteId : undefined,
      vendorId: sourceType === 'vendor' ? selectedVendorId : undefined,
      destination: sourceType === 'vendor' ? destination : undefined,
      freightType: freightMode,
      speed: speedPref
    };
    
    await onSubmit(input);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualOrigin.trim() || !manualDestination.trim() || manualWeight <= 0) return;
    
    const input: PlanRouteInput = {
      mode: 'manual',
      origin: manualOrigin,
      destination: manualDestination,
      freightType: manualFreightType,
      speed: manualSpeed,
      weightKg: manualWeight,
      lengthCm: manualLength,
      widthCm: manualWidth,
      heightCm: manualHeight
    };
    
    await onSubmit(input);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'saved' | 'manual')} defaultValue="saved">
        <TabsList className="grid w-full grid-cols-2 mb-5 md:mb-6 gap-2 md:gap-3">
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-6 md:space-y-7">
          <form onSubmit={handleSavedSubmit} className="space-y-6 md:space-y-7">
            {/* Source Type Selection */}
            <div className="space-y-3 md:space-y-4">
              <div className="text-sm font-medium text-muted-foreground mb-2 md:mb-3">
                Plan using
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <button
                  type="button"
                  onClick={() => setSourceType('quote')}
                  className={`w-full py-3 md:py-4 rounded-xl border bg-white hover:bg-muted/40 transition-colors ${
                    sourceType === 'quote'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  Saved Quote
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('vendor')}
                  className={`w-full py-3 md:py-4 rounded-xl border bg-white hover:bg-muted/40 transition-colors ${
                    sourceType === 'vendor'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  Saved Vendor
                </button>
              </div>
            </div>

            {/* Quote Selection */}
            {sourceType === 'quote' && (
              <div className="space-y-3 md:space-y-4">
                <Label className="mb-2 block">Saved Quote</Label>
                <select
                  className={selectCls}
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                >
                  <option value="">Select a quote...</option>
                  {quotesLoading ? (
                    <option value="" disabled>Loading quotes...</option>
                  ) : quotes.length === 0 ? (
                    <option value="" disabled>No saved quotes</option>
                  ) : (
                    quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.vendor_name} - {quote.origin_city} → {quote.destination_city}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Vendor Selection */}
            {sourceType === 'vendor' && (
              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label className="mb-2 block">Saved Vendor</Label>
                  <select
                    className={selectCls}
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} - {vendor.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-2 block">Destination</Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            )}

            {/* Freight Type and Speed */}
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label className="mb-2 block">Freight Type</Label>
                  <select
                    className={selectCls}
                    value={freightMode}
                    onChange={(e) => setFreightMode(e.target.value as any)}
                  >
                    <option value="air">Air</option>
                    <option value="sea">Sea</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-2 block">Speed</Label>
                  <select
                    className={selectCls}
                    value={speedPref}
                    onChange={(e) => setSpeedPref(e.target.value as any)}
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-1 md:pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-12 text-base font-semibold bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Planning..." : "Plan routes"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6 md:space-y-7">
          <form onSubmit={handleManualSubmit} className="space-y-6 md:space-y-7">
            {/* Manual Entry Form */}
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label className="mb-2 block">Origin</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Shanghai, China"
                    value={manualOrigin}
                    onChange={(e) => setManualOrigin(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Destination</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Los Angeles, USA"
                    value={manualDestination}
                    onChange={(e) => setManualDestination(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label className="mb-2 block">Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Length (cm)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={manualLength}
                    onChange={(e) => setManualLength(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Width (cm)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={manualWidth}
                    onChange={(e) => setManualWidth(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label className="mb-2 block">Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={manualHeight}
                    onChange={(e) => setManualHeight(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Freight Type</Label>
                  <select
                    className={selectCls}
                    value={manualFreightType}
                    onChange={(e) => setManualFreightType(e.target.value as any)}
                  >
                    <option value="air">Air</option>
                    <option value="sea">Sea</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-2 block">Speed</Label>
                  <select
                    className={selectCls}
                    value={manualSpeed}
                    onChange={(e) => setManualSpeed(e.target.value as any)}
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-1 md:pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-12 text-base font-semibold bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Planning..." : "Plan routes"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
