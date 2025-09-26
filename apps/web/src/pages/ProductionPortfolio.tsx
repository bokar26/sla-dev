import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Download } from 'lucide-react';
import { KpiCards } from '../components/portfolio/KpiCards';
import { RegionDonut } from '../components/portfolio/RegionDonut';
import { RevenueBySupplierBar } from '../components/portfolio/RevenueBySupplierBar';
import { SuppliersTable } from '../components/portfolio/SuppliersTable';
import { SupplierDrawer } from '../components/portfolio/SupplierDrawer';
import { Suggestions } from '../components/portfolio/Suggestions';
import { usePortfolioOverview } from '../hooks/portfolio/usePortfolioOverview';
import { useSuppliers } from '../hooks/portfolio/useSuppliers';
import { useSupplierDetail } from '../hooks/portfolio/useSupplierDetail';
import { useSuggestions } from '../hooks/portfolio/useSuggestions';
import { PortfolioFilters } from '../types/portfolio';

export default function ProductionPortfolio() {
  const [filters, setFilters] = useState<PortfolioFilters>({
    from: '2024-06-01',
    to: '2024-08-31',
    region: 'ALL',
    search: '',
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data hooks
  const { data: overview, loading: overviewLoading } = usePortfolioOverview(filters);
  const { data: suppliers, loading: suppliersLoading } = useSuppliers(filters);
  const { data: supplierDetail, loading: supplierDetailLoading } = useSupplierDetail(selectedSupplierId, filters);
  
  // Get the dominant region for suggestions
  const dominantRegion = overview?.regionMix?.reduce((prev, current) => 
    (prev.revenue > current.revenue) ? prev : current
  )?.region || 'APAC';
  
  const { data: suggestions, loading: suggestionsLoading } = useSuggestions(dominantRegion, 3);

  const handleRegionClick = (region: string) => {
    setFilters(prev => ({ ...prev, region }));
  };

  const handleSupplierClick = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedSupplierId(null);
  };

  const handleFilterChange = (key: keyof PortfolioFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportCSV = () => {
    if (!suppliers || suppliers.length === 0) return;

    const headers = ['Supplier', 'Country', 'Region', 'Revenue', 'COGS', 'GM $', 'GM %', 'SKUs'];
    const csvContent = [
      headers.join(','),
      ...suppliers.map(supplier => [
        `"${supplier.supplier.name}"`,
        `"${supplier.supplier.country}"`,
        `"${supplier.supplier.region}"`,
        supplier.revenue,
        supplier.cogs,
        supplier.gm,
        supplier.gmPct,
        supplier.skus
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${filters.from}-to-${filters.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Production Portfolio</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor suppliers, SKUs, and margins across your production network
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={!suppliers || suppliers.length === 0}
              className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="ALL">All Regions</option>
              <option value="APAC">APAC</option>
              <option value="EMEA">EMEA</option>
              <option value="AMER">AMER</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* KPI Cards */}
        <KpiCards data={overview} loading={overviewLoading} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RegionDonut 
            data={overview} 
            loading={overviewLoading} 
            onRegionClick={handleRegionClick}
          />
          <RevenueBySupplierBar 
            data={suppliers} 
            loading={suppliersLoading}
            onSupplierClick={handleSupplierClick}
          />
        </div>

        {/* Table and Suggestions Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SuppliersTable 
              data={suppliers} 
              loading={suppliersLoading}
              onSupplierClick={handleSupplierClick}
            />
          </div>
          <div>
            <Suggestions 
              data={suggestions} 
              loading={suggestionsLoading}
              region={dominantRegion}
            />
          </div>
        </div>
      </div>

      {/* Supplier Detail Drawer */}
      <SupplierDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        data={supplierDetail}
        loading={supplierDetailLoading}
      />
    </div>
  );
}
