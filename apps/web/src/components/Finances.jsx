import React, { useState, useEffect } from 'react';
import { CardGlass, StatCard, ChartCard } from '../user/components/UiKit';
import SleekButton from './ui/SleekButton';
import { 
  Calculator, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  ChevronUp,
  ChevronDown,
  Download,
  Plus
} from 'lucide-react';

const Finances = () => {
  const [financialData, setFinancialData] = useState({});
  
  // Sorting state for commission table
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Commission data
  const commissionData = [
    { date: '2024-01-15', revenue: 25000 },
    { date: '2024-01-22', revenue: 18000 },
    { date: '2024-02-05', revenue: 32000 },
    { date: '2024-02-18', revenue: 22000 },
    { date: '2024-03-03', revenue: 28000 }
  ];

  // Sorting functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCommissionData = [...commissionData].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle date sorting
    if (sortConfig.key === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle commission amount sorting (calculate from revenue)
    if (sortConfig.key === 'commission') {
      aValue = a.revenue * 0.05;
      bValue = b.revenue * 0.05;
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  // Mock financial data
  const mockFinancialData = {
    overview: {
      totalRevenue: 125000,
      totalExpenses: 85000,
      netProfit: 40000,
      profitMargin: 32,
      monthlyGrowth: 12.5,
      cashFlow: 15000
    },
    revenue: {
      current: 125000,
      previous: 111000,
      growth: 12.6,
      breakdown: [
        { category: 'Product Sales', amount: 95000, percentage: 76 },
        { category: 'Services', amount: 20000, percentage: 16 },
        { category: 'Licensing', amount: 10000, percentage: 8 }
      ]
    },
    expenses: {
      current: 85000,
      previous: 78000,
      growth: 9.0,
      breakdown: [
        { category: 'Manufacturing', amount: 45000, percentage: 53 },
        { category: 'Marketing', amount: 15000, percentage: 18 },
        { category: 'Operations', amount: 12000, percentage: 14 },
        { category: 'Administrative', amount: 8000, percentage: 9 },
        { category: 'Other', amount: 5000, percentage: 6 }
      ]
    }
  };


  useEffect(() => {
    // Load data from localStorage or use mock data
    const savedFinancialData = JSON.parse(localStorage.getItem('financialData') || '{}');

    if (Object.keys(savedFinancialData).length > 0) {
      setFinancialData(savedFinancialData);
    } else {
      setFinancialData(mockFinancialData);
      localStorage.setItem('financialData', JSON.stringify(mockFinancialData));
    }
  }, []);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const exportFinancialData = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Subcategory', 'Amount', 'Type', 'Status', 'Reference'],
      ...transactions.map(transaction => [
        transaction.date,
        transaction.description,
        transaction.category,
        transaction.subcategory,
        transaction.amount,
        transaction.type,
        transaction.status,
        transaction.reference
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-emerald-900/20 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Financial Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Track revenue, expenses, and financial performance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <SleekButton
                variant="outline"
                onClick={exportFinancialData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </SleekButton>
              <SleekButton
                variant="primary"
                onClick={() => setShowAddTransaction(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </SleekButton>
            </div>
          </div>

        </div>

        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Total Revenue"
                value={formatCurrency(financialData.overview?.totalRevenue || 0)}
                delta={formatPercentage(financialData.overview?.monthlyGrowth || 0)}
                up={true}
                delay={0}
              />
              <StatCard
                icon={<CreditCard className="w-6 h-6" />}
                label="Total Commission"
                value={formatCurrency((financialData.overview?.totalRevenue || 0) * 0.05)}
                delta="5% of revenue"
                up={true}
                delay={0.1}
              />
            </div>

            {/* Commission Table */}
            <CardGlass className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Commission Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('revenue')}
                      >
                        <div className="flex items-center gap-2">
                          Revenue
                          {getSortIcon('revenue')}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Commission %
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('commission')}
                      >
                        <div className="flex items-center gap-2">
                          Commission Amount
                          {getSortIcon('commission')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {sortedCommissionData.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {item.date}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          5.0%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.revenue * 0.05)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 dark:bg-emerald-900/20 font-semibold">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        Total
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(commissionData.reduce((sum, item) => sum + item.revenue, 0))}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        5.0%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(commissionData.reduce((sum, item) => sum + (item.revenue * 0.05), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardGlass>
          </div>

      </div>
    </div>
  );
};

export default Finances;
