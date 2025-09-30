import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, CreditCard, Banknote, Download, Plus } from 'lucide-react';
import UploadTransactionsModal from '../../features/transactions/UploadTransactionsModal';
import { useTransactionsStore } from '../../stores/transactionsStore';
import { get } from '../../lib/http';

export default function FinancesPage() {
  const [financialData, setFinancialData] = useState({});
  const [openUpload, setOpenUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const { items, order, setAll } = useTransactionsStore();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await get("/api/transactions");
        setAll(data.items || []);
        
        // Calculate financial overview from transactions
        const transactions = data.items || [];
        const totalRevenue = transactions
          .filter(t => t.category === 'Revenue')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = transactions
          .filter(t => t.category === 'COGS' || t.category === 'Expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        setFinancialData({
          overview: {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            monthlyGrowth: 12.5, // TODO: Calculate from historical data
            cashFlow: netProfit * 0.8 // Simplified cash flow calculation
          }
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Fallback to empty data
        setFinancialData({
          overview: {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
            monthlyGrowth: 0,
            cashFlow: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [setAll]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setOpenUpload(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          </div>
        </div>

                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="mt-2 text-slate-500">Loading financial data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Financial Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialData.overview?.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatPercentage(12.6)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialData.overview?.totalExpenses || 0)}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {formatPercentage(9.0)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialData.overview?.netProfit || 0)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {financialData.overview?.profitMargin || 0}% margin
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cash Flow</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialData.overview?.cashFlow || 0)}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {formatPercentage(financialData.overview?.monthlyGrowth || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Banknote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

                      {/* Commission Table */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vendor/Client</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.slice(0, 5).map(id => {
                                const tx = items[id];
                                if (!tx) return null;
                                return (
                                  <tr key={id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                      {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                      {tx.vendor || tx.client || 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                      {formatCurrency(tx.amount)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                      {tx.category}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
        
        <UploadTransactionsModal open={openUpload} onOpenChange={setOpenUpload} />
      </div>
    </div>
  );
}
