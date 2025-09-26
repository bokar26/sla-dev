import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Download, Save, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Factory as FactoryType } from '../../types/factory';
import { QuoteInput, QuoteCalc, QuoteState } from '../../types/quote';
import { generateQuote, saveQuote } from '@/services/quotes';

interface QuoteEditorProps {
  factory: FactoryType | null;
  initialDraft?: QuoteInput;
  onGenerate: (calc: QuoteCalc) => void;
  onSave: (quoteId: string) => void;
  onClose: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  factory,
  initialDraft,
  onGenerate,
  onSave,
  onClose,
}) => {
  // Guard clause for null factory
  if (!factory) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">No factory selected</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState<QuoteInput>({
    productName: '',
    description: '',
    quantity: 1000,
    specifications: {},
    materials: [],
    targetUnitCost: 0,
    incoterm: 'FOB',
    shipFrom: factory?.city && factory?.country ? `${factory.city}, ${factory.country}` : factory?.country || '',
    shipTo: '',
    desiredLeadTimeDays: factory?.standard_lead_time || 30,
    packaging: '',
    sizes: [],
    notes: '',
    region: 'APAC',
    targetPrice: 0,
    ...initialDraft,
  });

  const [quoteState, setQuoteState] = useState<QuoteState>('idle');
  const [generatedCalc, setGeneratedCalc] = useState<QuoteCalc | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mark form as dirty when inputs change after generation
  useEffect(() => {
    if (quoteState === 'generated' && generatedCalc) {
      setIsDirty(true);
    }
  }, [formData, quoteState, generatedCalc]);

  const handleInputChange = (field: keyof QuoteInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleGenerateQuote = async () => {
    if (!formData.productName.trim() || formData.quantity <= 0) {
      setError('Please fill in required fields: Product Name and Quantity');
      return;
    }

    setQuoteState('calculating');
    setError(null);

    try {
      console.log('Generating quote with data:', {
        factoryId: factory?.id || '',
        payload: formData,
      });
      
      const calc = await generateQuote({
        factoryId: factory?.id || '',
        payload: formData,
      });

      console.log('Quote generated successfully:', calc);
      setGeneratedCalc(calc);
      setQuoteState('generated');
      setIsDirty(false);
      onGenerate(calc);
    } catch (err) {
      console.error('Quote generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quote');
      setQuoteState('idle');
    }
  };

  const handleSaveQuote = async () => {
    if (!generatedCalc) return;

    try {
      console.log('Saving quote with data:', {
        factoryId: factory?.id || '',
        factoryName: factory?.name || 'Unknown Factory',
        status: 'saved',
        input: formData,
        calc: generatedCalc,
        source: factory?.source || 'internal',
        sourceId: factory?.id || '',
        storefrontUrl: factory?.storefrontUrl,
      });
      
      const savedQuote = await saveQuote({
        factoryId: factory?.id || '',
        factoryName: factory?.name || 'Unknown Factory',
        status: 'saved',
        input: formData,
        calc: generatedCalc,
        source: factory?.source || 'internal',
        sourceId: factory?.id || '',
        storefrontUrl: factory?.storefrontUrl,
      });

      console.log('Quote saved successfully:', savedQuote);
      
      // Show success message
      setSuccessMessage('Quote saved successfully! You can find it in the Saved tab.');
      setError(null);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      onSave(savedQuote.id);
    } catch (err) {
      console.error('Quote save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save quote');
      setSuccessMessage(null);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Download PDF functionality to be implemented');
  };

  const handlePrint = () => {
    window.print();
  };

  const isFormValid = formData.productName.trim() && formData.quantity > 0;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Create Quote</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Factory Info */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">{factory?.name || 'Unknown Factory'}</h3>
          <p className="text-sm text-muted-foreground">
            {factory?.city && factory?.country ? `${factory.city}, ${factory.country}` : factory?.country || 'Unknown Location'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="e.g., Cotton T-Shirt"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
              placeholder="Detailed product description..."
            />
          </div>

          {/* Quantity and Target Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Target Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetPrice || ''}
                onChange={(e) => handleInputChange('targetPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Materials
            </label>
            <input
              type="text"
              value={formData.materials?.map(m => m.name).join(', ') || ''}
              onChange={(e) => {
                const materials = e.target.value.split(',').map(name => ({ name: name.trim() })).filter(m => m.name);
                handleInputChange('materials', materials);
              }}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="e.g., Cotton, Polyester"
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Specifications
            </label>
            <textarea
              value={formData.specifications ? Object.entries(formData.specifications).map(([k, v]) => `${k}: ${v}`).join('\n') : ''}
              onChange={(e) => {
                const specs: Record<string, string | number> = {};
                e.target.value.split('\n').forEach(line => {
                  const [key, value] = line.split(':');
                  if (key && value) {
                    specs[key.trim()] = value.trim();
                  }
                });
                handleInputChange('specifications', specs);
              }}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
              placeholder="Color: Navy Blue&#10;Size: M, L, XL&#10;Weight: 180 GSM"
            />
          </div>

          {/* Incoterm and Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Incoterm
              </label>
              <select
                value={formData.incoterm || 'FOB'}
                onChange={(e) => handleInputChange('incoterm', e.target.value as any)}
                className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="EXW">EXW</option>
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="DDP">DDP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Lead Time (days)
              </label>
              <input
                type="number"
                value={formData.desiredLeadTimeDays || ''}
                onChange={(e) => handleInputChange('desiredLeadTimeDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="30"
              />
            </div>
          </div>

          {/* Ship To */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Ship To
            </label>
            <input
              type="text"
              value={formData.shipTo || ''}
              onChange={(e) => handleInputChange('shipTo', e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="e.g., New York, USA"
            />
          </div>

          {/* Packaging */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Packaging
            </label>
            <input
              type="text"
              value={formData.packaging || ''}
              onChange={(e) => handleInputChange('packaging', e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="e.g., Individual poly bags, 50 pieces per carton"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={2}
              placeholder="Additional requirements or notes..."
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-2" />
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Generated Quote Preview */}
        {generatedCalc && quoteState === 'generated' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Quote Generated
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium">${(generatedCalc.unitCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${(generatedCalc.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">${(generatedCalc.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-700 pt-2">
                <span className="font-medium text-emerald-800 dark:text-emerald-200">Total:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">${(generatedCalc.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery:</span>
                <span className="font-medium">{generatedCalc.deliveryTime || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border space-y-3">
        {/* Generate/Save Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerateQuote}
            disabled={!isFormValid || quoteState === 'calculating'}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center"
          >
            {quoteState === 'calculating' ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : isDirty ? (
              'Re-generate Quote'
            ) : (
              'Generate Quote'
            )}
          </button>
          
          {generatedCalc && (
            <button
              onClick={handleSaveQuote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          )}
        </div>

        {/* Action Buttons */}
        {generatedCalc && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
