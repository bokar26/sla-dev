import React from 'react';
import { PortfolioOverview } from '../../types/portfolio';
import { DollarSign, TrendingUp, Building2, Package, Users, Globe, CreditCard } from 'lucide-react';
import { StatCard } from '../../user/components/UiKit';

interface KpiCardsProps {
  data: PortfolioOverview | null;
  loading: boolean;
  onNavigateToFinances?: () => void;
}

export function KpiCards({ data, loading, onNavigateToFinances }: KpiCardsProps) {
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

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-emerald-50/60 dark:bg-neutral-900/80 backdrop-blur-xl rounded-lg border border-emerald-200/50 dark:border-white/10 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Loading...</div>
              <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">—</div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-emerald-50/60 dark:bg-neutral-900/80 backdrop-blur-xl rounded-lg border border-emerald-200/50 dark:border-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">No Data</div>
            <div className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">—</div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'SKUs',
      value: data.skus.toString(),
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Total Commission',
      value: formatCurrency(data.totalRevenue * 0.05), // 5% commission example
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isClickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const CardComponent = kpi.isClickable ? 'button' : 'div';
        return (
          <CardComponent 
            key={index} 
            className={`bg-emerald-50/60 dark:bg-neutral-900/80 backdrop-blur-xl rounded-lg border border-emerald-200/50 dark:border-white/10 p-3 shadow-sm ${kpi.isClickable ? 'hover:bg-emerald-100/80 dark:hover:bg-neutral-800/80 cursor-pointer transition-all duration-200' : ''}`}
            onClick={kpi.isClickable ? onNavigateToFinances : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{kpi.title}</div>
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{kpi.value}</div>
          </CardComponent>
        );
      })}
    </div>
  );
}
