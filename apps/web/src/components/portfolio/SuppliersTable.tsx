import React, { useState } from 'react';
import { SupplierRow } from '../../types/portfolio';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { CardGlass } from '../../user/components/UiKit';

interface SuppliersTableProps {
  data: SupplierRow[];
  loading: boolean;
  onSupplierClick?: (supplierId: string) => void;
}

type SortField = 'revenue' | 'gmPct' | 'name' | 'skus';
type SortDirection = 'asc' | 'desc';

export function SuppliersTable({ data, loading, onSupplierClick }: SuppliersTableProps) {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'revenue':
        aValue = a.revenue;
        bValue = b.revenue;
        break;
      case 'gmPct':
        aValue = a.gmPct;
        bValue = b.gmPct;
        break;
      case 'name':
        aValue = a.supplier.name.toLowerCase();
        bValue = b.supplier.name.toLowerCase();
        break;
      case 'skus':
        aValue = a.skus;
        bValue = b.skus;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const direction = isActive ? sortDirection : null;
    
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center space-x-1 text-left font-medium text-foreground hover:text-emerald-600"
      >
        <span>{children}</span>
        {isActive && (
          direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <CardGlass title="Suppliers">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded mb-2"></div>
          ))}
        </div>
      </CardGlass>
    );
  }

  if (!data || data.length === 0) {
    return (
      <CardGlass title="Suppliers">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No suppliers found</p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass title="Suppliers">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortButton field="name">Supplier</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortButton field="revenue">Revenue</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  COGS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  GM $
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortButton field="gmPct">GM %</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortButton field="skus">SKUs</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedData.map((supplier) => (
                <tr key={supplier.supplier.id} className="hover:bg-muted/60">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {supplier.supplier.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.supplier.country}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {supplier.supplier.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                    {formatCurrency(supplier.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                    {formatCurrency(supplier.cogs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                    {formatCurrency(supplier.gm)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.gmPct >= 30 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      supplier.gmPct >= 20 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {formatPercentage(supplier.gmPct)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                    {supplier.skus}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onSupplierClick?.(supplier.supplier.id)}
                      className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </CardGlass>
  );
}
