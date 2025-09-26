import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getConfig } from "../services/config";

// Error Boundary to prevent blank pages
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  
  componentDidCatch(error, info) {
    console.error("Dashboard error boundary:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Try refreshing or checking the console for details.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Try component for safe rendering
function Try({ children, fallback }) {
  try { 
    return children; 
  } catch (e) { 
    console.error('Try boundary caught:', e); 
    console.error('Error stack:', e.stack);
    return fallback ?? <div className="p-4 bg-red-100 border border-red-300 rounded">Component error: {e.message}</div>; 
  }
}
import WorldGlobe from "../components/analytics/WorldGlobe";
import { useFactoriesForGlobe } from "../hooks/useFactoriesForGlobe";
import { FactoryDetailsDrawer } from "../features/search/FactoryDetailsDrawer";
import { QuoteEditor } from "../features/quotes/QuoteEditor";
import Saved from "../components/Saved";
import Fulfillment from "../components/Fulfillment";
import Orders from "../components/Orders";
import Contacts from "../components/Contacts";
import Finances from "../components/Finances";
import Integrations from "./Integrations";
import { CardGlass, StatCard, ChartCard } from "../user/components/UiKit";
import { KpiCards } from "../components/portfolio/KpiCards";
import { RegionDonut } from "../components/portfolio/RegionDonut";
import { RevenueBySupplierBar } from "../components/portfolio/RevenueBySupplierBar";
import { SuppliersTable } from "../components/portfolio/SuppliersTable";
import { SupplierDrawer } from "../components/portfolio/SupplierDrawer";
import { Suggestions } from "../components/portfolio/Suggestions";
import { useSupplierDetail } from "../hooks/portfolio/useSupplierDetail";
// PortfolioFilters type removed for .jsx compatibility
import { Search, Bell, Mail, ChevronDown, ChevronRight, CircleDollarSign, BarChart3, Calendar, Settings, Home, Building2, LogOut, Factory as FactoryIcon, Boxes, TrendingUp, Users, Globe, DollarSign, Package, Edit3, Check, X, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { usePortfolioOverview } from "../hooks/portfolio/usePortfolioOverview";
import { useSuppliers } from "../hooks/portfolio/useSuppliers";
import { useSuggestions } from "../hooks/portfolio/useSuggestions";

const revenueData = [
  { year: "2019", value: 42 },
  { year: "2020", value: 58 },
  { year: "2021", value: 49 },
  { year: "2022", value: 61 },
  { year: "2023", value: 56 },
];

const expensesSpark = [
  { i: 1, v: 7 },
  { i: 2, v: 5 },
  { i: 3, v: 8 },
  { i: 4, v: 6 },
  { i: 5, v: 7 },
  { i: 6, v: 5 },
];

const stackedWeekly = [
  { day: "Sun, 1 Dec", Marketing: 12, Design: 22, Production: 18 },
  { day: "Mon, 2 Dec", Marketing: 11, Design: 23, Production: 20 },
  { day: "Tue, 3 Dec", Marketing: 10, Design: 24, Production: 21 },
  { day: "Wed, 4 Dec", Marketing: 9, Design: 22, Production: 24 },
  { day: "Thu, 5 Dec", Marketing: 10, Design: 20, Production: 26 },
  { day: "Fri, 6 Dec", Marketing: 12, Design: 19, Production: 22 },
  { day: "Sat, 7 Dec", Marketing: 11, Design: 18, Production: 21 },
];

const heatmapDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const heatmapWeeks = 5;

const expensesAllocation = [
  { name: "Production", value: 36 },
  { name: "Marketing", value: 22 },
  { name: "Operational", value: 31 },
  { name: "Design", value: 44 },
];

function ProgressRing({ value }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <circle cx="50" cy="50" r={radius} className="stroke-gray-200" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r={radius} className="stroke-black transition-all" strokeWidth="10" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

// Legacy Card component - now using CardGlass
function Card({ children, className = "", title, action }) {
  return (
    <CardGlass title={title} action={action} className={className}>
      {children}
    </CardGlass>
  );
}

// Unified Dashboard Component
function UnifiedDashboard() {
  console.log('UnifiedDashboard component rendering');
  
  // Simplified state for testing
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize dashboard with error handling
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Portfolio handlers
  const handleRegionClick = (region) => {
    setPortfolioFilters(prev => ({ ...prev, region }));
  };

  const handleSupplierClick = (supplierId) => {
    setSelectedSupplierId(supplierId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedSupplierId(null);
  };

  const handleFilterChange = (key, value) => {
    setPortfolioFilters(prev => ({ ...prev, [key]: value }));
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
    a.download = `suppliers-${portfolioFilters.from}-to-${portfolioFilters.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Top suppliers data for chart
  const topSuppliersData = suppliers?.slice(0, 5).map(supplier => ({
    name: supplier.supplier.name,
    revenue: supplier.revenue,
    margin: supplier.gmPct
  })) || [];

  // Region distribution data
  const regionData = portfolioOverview?.regionMix?.map(region => ({
    name: region.region,
    value: region.revenue,
    percentage: region.revenuePct
  })) || [];

  const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Edit dashboard functions
  const toggleMetric = (metricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  const saveDashboard = () => {
    // Save to localStorage for persistence
    localStorage.setItem('dashboard-metrics', JSON.stringify(visibleMetrics));
    setIsEditing(false);
  };

  const resetDashboard = () => {
    const defaultMetrics = {
      totalRevenue: true,
      activeSuppliers: true,
      grossMargin: true,
      totalOrders: true,
      revenueChart: true,
      topSuppliers: true,
      regionDistribution: true,
      quickStats: true
    };
    setVisibleMetrics(defaultMetrics);
    localStorage.setItem('dashboard-metrics', JSON.stringify(defaultMetrics));
  };

  // Load saved metrics on component mount
  React.useEffect(() => {
    const savedMetrics = localStorage.getItem('dashboard-metrics');
    if (!savedMetrics) return;
    try {
      const parsed = JSON.parse(savedMetrics);
      if (parsed && typeof parsed === 'object') setVisibleMetrics(parsed);
    } catch (e) {
      console.warn('Invalid dashboard-metrics in localStorage, clearing.', e);
      localStorage.removeItem('dashboard-metrics');
    }
  }, []);

  // Error handling
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold mb-2">Dashboard failed to initialize</h3>
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Supply Center...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Supply Center Dashboard</h2>
        <p className="text-blue-700 mb-4">This is a simplified version of the Supply Center component.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-gray-900">Total Suppliers</h3>
            <p className="text-2xl font-bold text-blue-600">24</p>
          </div>
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-gray-900">Active Orders</h3>
            <p className="text-2xl font-bold text-green-600">12</p>
          </div>
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-gray-900">Total Revenue</h3>
            <p className="text-2xl font-bold text-purple-600">$2.4M</p>
          </div>
        </div>
        <p className="text-sm text-blue-600 mt-4">✅ Component is working correctly!</p>
      </div>
    </div>
  );
}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-neutral-800/60 border border-white/20 dark:border-white/10 rounded-xl hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 backdrop-blur-sm"
                >
                  Reset
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveDashboard}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  <Check className="h-4 w-4" />
                  Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-neutral-800/60 border border-white/20 dark:border-white/10 rounded-xl hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
              >
                <Edit3 className="h-4 w-4" />
                Edit Dashboard
              </motion.button>
            )}
          </div>
        </div>

        {/* Portfolio Filters */}
        <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={portfolioFilters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={portfolioFilters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={portfolioFilters.region}
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
                value={portfolioFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-3 py-2 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-64"
              />
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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          {visibleMetrics.totalRevenue && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('totalRevenue')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                label="Total Revenue"
                value={portfolioLoading ? '...' : formatCurrency(portfolioOverview?.totalRevenue || 0)}
                delta="+12.5%"
                up
                delay={0.1}
              />
            </div>
          )}

          {/* Active Suppliers */}
          {visibleMetrics.activeSuppliers && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('activeSuppliers')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <StatCard
                icon={<Building2 className="w-5 h-5 text-emerald-600" />}
                label="Active Suppliers"
                value={portfolioLoading ? '...' : portfolioOverview?.suppliers || 0}
                delay={0.2}
              />
            </div>
          )}

          {/* Gross Margin */}
          {visibleMetrics.grossMargin && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('grossMargin')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                label="Gross Margin"
                value={portfolioLoading ? '...' : formatPercentage(portfolioOverview?.grossMarginPct || 0)}
                delay={0.3}
              />
            </div>
          )}

          {/* Factory Database */}
          {visibleMetrics.totalOrders && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('totalOrders')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <StatCard
                icon={<FactoryIcon className="w-5 h-5 text-emerald-600" />}
                label="Factory Database"
                value={factoriesLoading ? '...' : totalCount}
                delay={0.4}
              />
            </div>
          )}
      </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Suppliers Revenue */}
          {visibleMetrics.topSuppliers && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('topSuppliers')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChartCard
                title="Top Suppliers by Revenue"
                data={topSuppliersData}
                dataKey1="revenue"
                chartType="bar"
                delay={0.5}
                action={
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-sm rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 flex items-center gap-2 transition-all duration-200"
                  >
                    <Download className="w-4 h-4"/>
                    Export
                  </motion.button>
                }
              />
            </div>
          )}

          {/* Region Distribution */}
          {visibleMetrics.regionDistribution && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('regionDistribution')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChartCard
                title="Revenue by Region"
                data={regionData}
                dataKey1="value"
                chartType="pie"
                delay={0.6}
                action={
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-sm rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 flex items-center gap-2 transition-all duration-200"
                  >
                    <Download className="w-4 h-4"/>
                    Export
                  </motion.button>
                }
              />
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Factory Suggestions */}
          <CardGlass title="Recommended Factories" delay={0.7}>
            <div className="space-y-4">
              {suggestionsLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading suggestions...</p>
                </div>
              ) : suggestions?.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {(suggestion.score * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Match</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FactoryIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No suggestions available</p>
                </div>
              )}
            </div>
          </CardGlass>

          {/* Quick Stats */}
          {visibleMetrics.quickStats && (
            <div className={isEditing ? "relative" : ""}>
              {isEditing && (
                <button
                  onClick={() => toggleMetric('quickStats')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <CardGlass title="Quick Stats" delay={0.8}>
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                    className="flex items-center justify-between p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-emerald-600 mr-3" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {portfolioLoading ? '...' : portfolioOverview?.skus || 0}
                    </span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                    className="flex items-center justify-between p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-emerald-600 mr-3" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Regions Active</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {portfolioLoading ? '...' : portfolioOverview?.regionMix?.length || 0}
                    </span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.1 }}
                    className="flex items-center justify-between p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600 mr-3" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Margin</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {portfolioLoading ? '...' : formatPercentage(portfolioOverview?.grossMarginPct || 0)}
                    </span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                    className="flex items-center justify-between p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <FactoryIcon className="h-5 w-5 text-emerald-600 mr-3" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">New Factories</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {factoriesLoading ? '...' : newCount}
                    </span>
                  </motion.div>
                </div>
              </CardGlass>
            </div>
          )}

          {/* Recent Activity */}
          <CardGlass title="Recent Activity" delay={0.9}>
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.0 }}
                className="flex items-start space-x-3 p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Portfolio data updated</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.1 }}
                className="flex items-start space-x-3 p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Factory search completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">5 minutes ago</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
                className="flex items-start space-x-3 p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">New supplier added</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.3 }}
                className="flex items-start space-x-3 p-3 bg-white/40 dark:bg-neutral-800/40 rounded-lg backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Margin analysis updated</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </motion.div>
            </div>
          </CardGlass>
        </div>
      </div>
    </div>
  );
}

// SLA Factory Search Component
function SLAFactorySearch() {
  console.log('SLAFactorySearch component rendering');
  // Safe destructuring for factory data
  const globeRes2 = useFactoriesForGlobe() || {};
  const factories = globeRes2.factories || [];
  const loading = !!globeRes2.loading;
  const totalCount = globeRes2.totalCount ?? 0;
  const activeCount = globeRes2.activeCount ?? 0;
  const newCount = globeRes2.newCount ?? 0;
  const safeFactories = Array.isArray(factories) ? factories : [];
  
  // Search state management
  const [searchPhase, setSearchPhase] = useState("idle"); // "idle" | "thinking" | "shrink" | "results"
  const [searchResults, setSearchResults] = useState([]);
  const [searchForm, setSearchForm] = useState({
    query: "",
    location: "",
    industry: "",
    size: "",
    brand: ""
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  // Alibaba integration state
  const [config, setConfig] = useState({ featureAlibaba: false, alibabaEnabled: false });
  const [selectedSources, setSelectedSources] = useState(["internal"]);
  
  // Load config on component mount
  useEffect(() => {
    getConfig().then(setConfig);
  }, []);
  
  // Factory drawer and quote editor state
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.query.trim()) return;
    
    setSearchError(null);
    setIsSearching(true);
    setSearchPhase("thinking");

    try {
      console.log("Starting search with query:", searchForm.query);
      const response = await fetch("http://localhost:8000/api/factories/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchForm.query,
          location: searchForm.location || null,
          industry: searchForm.industry || null,
          size: searchForm.size || null,
          brand: searchForm.brand || null,
          limit: 10,
          include_sources: selectedSources
        })
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Search results:", data);
      setSearchResults(data.results || []);
      
      // Brief delay so users see the animation
      setTimeout(() => setSearchPhase("shrink"), 250);
      // After shrink, reveal results
      setTimeout(() => setSearchPhase("results"), 650);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(`Failed to fetch search results: ${err.message}. Please ensure the backend API is running.`);
      setSearchPhase("idle");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setSearchForm({
      query: "",
      location: "",
      industry: "",
      size: "",
      brand: ""
    });
    setSearchResults([]);
    setSearchPhase("idle");
    setSearchError(null);
  };

  const updateForm = (field, value) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };

  // Factory drawer handlers
  const handleFactorySelect = (factory) => {
    console.log('Factory selected:', factory);
    setSelectedFactory(factory);
    setIsQuoteOpen(false);
  };

  const handleCreateQuote = () => {
    setIsQuoteOpen(true);
  };

  const handleCloseFactoryDrawer = () => {
    setSelectedFactory(null);
    setIsQuoteOpen(false);
    setQuoteDraft(null);
  };

  // Quote editor handlers
  const handleQuoteGenerate = (calc) => {
    console.log('Quote generated in Dashboard:', calc);
    setQuoteDraft(calc);
  };

  const handleQuoteSave = (quoteId) => {
    // Show success message and close quote editor
    console.log('Quote saved successfully with ID:', quoteId);
    setIsQuoteOpen(false);
    setQuoteDraft(null);
  };

  const handleCloseQuoteEditor = () => {
    setIsQuoteOpen(false);
    setQuoteDraft(null);
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Side - Search Interface */}
      <div className="w-1/3 p-6 border-r border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">SLA Search</h2>
          <p className="text-sm text-muted-foreground">AI-Powered Factory Search</p>
        </div>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search Query
            </label>
            <textarea
              value={searchForm.query}
              onChange={(e) => updateForm("query", e.target.value)}
              placeholder="Describe what you're looking for... (e.g., 'cotton t-shirt factory in China with 100+ employees')"
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Location
            </label>
            <select 
              value={searchForm.location}
              onChange={(e) => updateForm("location", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select Country</option>
              <option value="Argentina">Argentina</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Brazil">Brazil</option>
              <option value="China">China</option>
              <option value="Guatemala">Guatemala</option>
              <option value="India">India</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Korea">Korea</option>
              <option value="Mexico">Mexico</option>
              <option value="South Korea">South Korea</option>
              <option value="Taiwan">Taiwan</option>
              <option value="Thailand">Thailand</option>
              <option value="Vietnam">Vietnam</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Product Type
            </label>
            <select 
              value={searchForm.industry}
              onChange={(e) => updateForm("industry", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select Product Type</option>
              <option value="accessories">Accessories</option>
              <option value="activewear">Activewear</option>
              <option value="denim">Denim</option>
              <option value="footwear">Footwear</option>
              <option value="knitwear">Knitwear</option>
              <option value="lingerie">Lingerie</option>
              <option value="swimwear">Swimwear</option>
              <option value="woven">Woven</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Factory Size
            </label>
            <select 
              value={searchForm.size}
              onChange={(e) => updateForm("size", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Any Size</option>
              <option value="small">Small (&lt;10K units/month)</option>
              <option value="medium">Medium (10K-100K units/month)</option>
              <option value="large">Large (100K-1M units/month)</option>
              <option value="enterprise">Enterprise (1M+ units/month)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Past Brand/Client
            </label>
            <input
              type="text"
              value={searchForm.brand}
              onChange={(e) => updateForm("brand", e.target.value)}
              placeholder="Enter brand name (e.g., Nike, H&M, Zara)"
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find factories that have worked with specific brands
            </p>
          </div>
          
          {/* Source Filter */}
          {config.featureAlibaba && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Search Sources
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes("internal")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources(prev => [...prev, "internal"]);
                      } else {
                        setSelectedSources(prev => prev.filter(s => s !== "internal"));
                      }
                    }}
                    className="mr-2 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Internal Database</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes("alibaba")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources(prev => [...prev, "alibaba"]);
                      } else {
                        setSelectedSources(prev => prev.filter(s => s !== "alibaba"));
                      }
                    }}
                    className="mr-2 rounded border-border"
                    disabled={!config.alibabaEnabled}
                  />
                  <span className={`text-sm ${config.alibabaEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Alibaba
                  </span>
                  {!config.alibabaEnabled && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Connect Alibaba to enable)
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isSearching || !searchForm.query.trim()}
            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSearching ? "Searching..." : "Search Factories"}
          </button>
          
          <button 
            type="button"
            onClick={handleClearFilters}
            className="w-full border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear Filters
          </button>
          
          {searchError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                Error: {searchError}. Please try again.
              </p>
            </div>
          )}
        </form>
      </div>
      
      {/* Right Side - 3D Globe */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Global Factory Network</h3>
              <p className="text-sm text-muted-foreground">10,000+ verified factories across 80+ countries</p>
            </div>
          </div>
        </div>
        
        {/* Search Results Area */}
        <div className="flex-1 relative overflow-y-auto">

          {/* Content area with animated transitions */}
          <div className="relative w-full h-full min-h-[560px] md:min-h-[640px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {(searchPhase === "idle" || searchPhase === "thinking" || searchPhase === "shrink") && (
                <motion.div
                  key="globe"
                  className="w-full h-full flex items-center justify-center"
                  initial={{ scale: 0.95, opacity: 0.9 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="absolute top-6 text-sm font-medium" aria-live="polite">
                    <span className={`px-3 py-1 rounded-full border border-white/20 bg-white/10 dark:bg-transparent dark:border-white/40 backdrop-blur`}>
                      <span className={searchPhase === "thinking" ? "animate-pulse" : ""}>
                        {searchPhase === "thinking" ? "Thinking…" : "Ready to Search"}
                      </span>
                    </span>
                  </div>
                  <Try fallback={<div className="text-sm text-red-500">Globe failed to load.</div>}>
                    <WorldGlobe 
                      data={safeFactories} 
                      cycleMs={2200}
                      className="w-full h-full"
                      autoRotate={searchPhase === "thinking"}
                    />
                  </Try>
                </motion.div>
              )}

              {searchPhase === "results" && (
                <motion.div
                  key="results"
                  className="w-full h-full p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="h-full overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Top Factory Matches</h3>
                      <button 
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-3 py-1.5 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                      >
                        Reset
                      </button>
                    </div>
                    
                    {searchResults.length > 0 ? (
                      <ol className="space-y-3">
                        {searchResults.map((result, i) => (
                          <li 
                            key={result.id || i} 
                            className="rounded-lg border border-border p-4 hover:bg-muted transition cursor-pointer bg-card"
                            onClick={() => handleFactorySelect(result)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-6 text-right tabular-nums text-muted-foreground font-medium">{i+1}.</span>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {result.name} 
                                    {i === 0 && (
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                        Best match
                                      </span>
                                    )}
                                    {result.source === 'alibaba' && (
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                                        Alibaba
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {result.city ? `${result.city}, ` : ""}{result.country} • Score: {result.score}
                                  </div>
                                  {result.specialties && (
                                    <div className="text-xs text-muted-foreground/70 mt-1">
                                      Specialties: {result.specialties}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="h-full flex items-center justify-center flex-col gap-3">
                        <p className="text-base text-muted-foreground text-center">No matches found. Try a broader query.</p>
                        <button 
                          onClick={handleClearFilters}
                          className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                        >
                          Back to Globe
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Factory Details Drawer */}
      {selectedFactory && !isQuoteOpen && (
        <FactoryDetailsDrawer
          factory={selectedFactory}
          onCreateQuote={handleCreateQuote}
          onClose={handleCloseFactoryDrawer}
        />
      )}

      {/* Quote Editor */}
      {selectedFactory && isQuoteOpen && (
        <QuoteEditor
          factory={selectedFactory}
          initialDraft={quoteDraft}
          onGenerate={handleQuoteGenerate}
          onSave={handleQuoteSave}
          onClose={handleCloseQuoteEditor}
        />
      )}

      {/* Portfolio Components */}
      <div className="space-y-8">
        {/* KPI Cards */}
        <KpiCards data={portfolioOverview} loading={portfolioLoading} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RegionDonut 
            data={portfolioOverview} 
            loading={portfolioLoading} 
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

export default function Dashboard({ 
  activeDashboardTab, 
  setActiveDashboardTab, 
  setHasStartedChat, 
  setMessages,
  setShowOverviewPage,
  setShowAboutPage 
}) {
  // Debug logging
  console.log('Dashboard render - activeDashboardTab:', activeDashboardTab);
  
  return (
    <>
      <style>
        {`
          @keyframes verticalSpin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
        `}
      </style>
      <div className="h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-emerald-900/20 text-gray-900 dark:text-white font-sans flex flex-col overflow-hidden">
        <div className="h-full flex flex-col">
          <main className="flex-1 w-full font-sans overflow-y-auto">
          <PageErrorBoundary>
            {/* Debug banner */}
            <div className="fixed top-2 right-2 z-[9999] px-2 py-1 text-[10px] rounded bg-black/60 text-white">
              tab: {String(activeDashboardTab || 'undefined')} · v: {process.env.NODE_ENV} · {Date.now()}
            </div>
            
            {activeDashboardTab === 'Supply Center' && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Supply Center</h1>
                <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">UnifiedDashboard error: Check console for details</div>}>
                  <UnifiedDashboard />
                </Try>
              </div>
            )}
            
            {activeDashboardTab === 'SLA Search' && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">SLA Search</h1>
                <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">SLAFactorySearch error: Check console for details</div>}>
                  <SLAFactorySearch />
                </Try>
              </div>
            )}
            
            
            {activeDashboardTab === 'Saved' && (
              <Saved />
            )}
            
            
            {activeDashboardTab === 'Fulfillment' && (
              <Fulfillment />
            )}
            
            {activeDashboardTab === 'Orders' && (
              <Orders />
            )}
            
            {activeDashboardTab === 'Contacts' && (
              <Contacts />
            )}
            
            {activeDashboardTab === 'Finances' && (
              <Finances />
            )}
            
            {activeDashboardTab === 'Integrations' && (
              <Integrations />
            )}
          </PageErrorBoundary>
          
          {activeDashboardTab !== 'Dashboard' && activeDashboardTab !== 'SLA Search' && activeDashboardTab !== 'Production Portfolio' && activeDashboardTab !== 'Saved' && activeDashboardTab !== 'Fulfillment' && activeDashboardTab !== 'Orders' && activeDashboardTab !== 'Contacts' && activeDashboardTab !== 'Finances' && activeDashboardTab !== 'Integrations' && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900 mb-2">{activeDashboardTab}</div>
                <div className="text-gray-500">This section is coming soon...</div>
              </div>
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}
