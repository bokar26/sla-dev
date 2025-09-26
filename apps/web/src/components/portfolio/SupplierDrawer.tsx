import React from 'react';
import { X } from 'lucide-react';
import { SupplierDetail } from '../../types/portfolio';

interface SupplierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: SupplierDetail | null;
  loading: boolean;
}

export function SupplierDrawer({ isOpen, onClose, data, loading }: SupplierDrawerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {data?.supplier.name || 'Supplier Details'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.supplier.country} • {data?.supplier.region}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded mb-2"></div>
                  ))}
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">
                      {formatCurrency(data.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total COGS</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">
                      {formatCurrency(data.totalCogs)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Margin</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">
                      {formatCurrency(data.totalGm)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GM %</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">
                      {formatPercentage(data.totalGmPct)}
                    </p>
                  </div>
                </div>

                {/* SKUs */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">SKUs</h3>
                  <div className="space-y-3">
                    {data.skus.map((skuData, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {skuData.sku.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {skuData.sku.code}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            skuData.gmPct >= 30 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            skuData.gmPct >= 20 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {formatPercentage(skuData.gmPct)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Cost</p>
                            <p className="font-medium tabular-nums text-foreground">
                              {formatCurrency(skuData.supplierSku.cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium tabular-nums text-foreground">
                              {skuData.supplierSku.price ? formatCurrency(skuData.supplierSku.price) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-medium tabular-nums text-foreground">
                              {formatCurrency(skuData.revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">COGS</p>
                            <p className="font-medium tabular-nums text-foreground">
                              {formatCurrency(skuData.cogs)}
                            </p>
                          </div>
                        </div>

                        {skuData.sales && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Units Sold</p>
                                <p className="font-medium tabular-nums text-foreground">
                                  {skuData.sales.units.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">MOQ</p>
                                <p className="font-medium tabular-nums text-foreground">
                                  {skuData.supplierSku.moq?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Lead Time</p>
                                <p className="font-medium tabular-nums text-foreground">
                                  {skuData.supplierSku.leadTimeDays ? `${skuData.supplierSku.leadTimeDays} days` : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No supplier data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
