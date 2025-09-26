import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SupplierRow } from '../../types/portfolio';

interface RevenueBySupplierBarProps {
  data: SupplierRow[];
  loading: boolean;
  onSupplierClick?: (supplierId: string) => void;
}

export function RevenueBySupplierBar({ data, loading, onSupplierClick }: RevenueBySupplierBarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revenue by Supplier</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revenue by Supplier</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No supplier data available</p>
        </div>
      </div>
    );
  }

  // Take top 10 suppliers
  const chartData = data.slice(0, 10).map(supplier => ({
    name: supplier.supplier.name.length > 15 
      ? supplier.supplier.name.substring(0, 15) + '...' 
      : supplier.supplier.name,
    fullName: supplier.supplier.name,
    revenue: supplier.revenue,
    gm: supplier.gm,
    gmPct: supplier.gmPct,
    supplierId: supplier.supplier.id,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-muted-foreground">
            GM: {formatCurrency(data.gm)} ({data.gmPct.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (onSupplierClick && data && data.supplierId) {
      onSupplierClick(data.supplierId);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Revenue by Supplier (Top 10)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              tick={{ fill: 'rgb(var(--muted-foreground))' }}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              fontSize={12}
              tick={{ fill: 'rgb(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#3B82F6" 
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
