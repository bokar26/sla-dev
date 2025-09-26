import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getConfig as getAppConfig } from "../services/config";
import { safeArray, safeReduce, safeSum } from "../utils/safe";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Globe, 
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Building2,
  Factory as FactoryIcon,
  Edit3,
  Check,
  X,
  Calendar,
  CreditCard,
  Percent,
  Upload
} from "lucide-react";
import WorldGlobe from "../components/analytics/WorldGlobe";
import { useFactoriesForGlobe } from "../hooks/useFactoriesForGlobe";
import { useSupplierDetail } from "../hooks/portfolio/useSupplierDetail";
import { usePortfolioOverview } from "../hooks/portfolio/usePortfolioOverview";
import { useFactoryDetails } from "../hooks/useFactoryDetails";
import FactoryDetailsDrawer from "../components/search/FactoryDetailsDrawer";
import { useSuppliers } from "../hooks/portfolio/useSuppliers";
import { useSuggestions } from "../hooks/portfolio/useSuggestions";
import { CardGlass, StatCard, ChartCard } from "../user/components/UiKit";
import { RegionDonut } from "../components/portfolio/RegionDonut";
import { RevenueBySupplierBar } from "../components/portfolio/RevenueBySupplierBar";
import { SuppliersTable } from "../components/portfolio/SuppliersTable";
import { SupplierDrawer } from "../components/portfolio/SupplierDrawer";
import { Suggestions } from "../components/portfolio/Suggestions";
import ClientsPage from "./database/clients/ClientsPage";
import SupplyCenterPage from "./SupplyCenterPage";

// --- inline helper: minimal, no external deps ---
function ImageDropInput({
  onAdd,
  accept = 'image/*',
  multiple = true,
  maxCount = 5,
}) {
  const ref = React.useRef(null);
  const fileRef = React.useRef(null);
  const [isOver, setIsOver] = React.useState(false);

  const handleFiles = (list) => {
    if (!list || list.length === 0) return;
    const picked = Array.from(list).slice(0, maxCount);
    onAdd(picked);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">Drop reference photos (optional)</label>
      <div
        ref={ref}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
        className={[
          "rounded-lg border border-dashed p-2 cursor-pointer",
          "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
          isOver ? "ring-2 ring-emerald-500/60 bg-emerald-100/90 dark:bg-emerald-800/30" : ""
        ].join(" ")}
        aria-label="Drop images here or click to upload"
      >
        <p className="text-xs opacity-80 text-muted-foreground">
          Drag & drop images here, or click to choose (max {maxCount})
        </p>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// Try component for safe rendering
function Try({ children, fallback }) {
  try {
    return children;
  } catch (e) {
    console.error('Component error:', e);
    console.error('Stack trace:', e.stack);
    return fallback ?? <div className="p-4 bg-red-100 border border-red-300 rounded">Component error: {e.message}</div>; 
  }
}

// EmptyState component for better UX
function EmptyState({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// Tab constants for navigation
const TABS = {
  finance: 'Finances',
  saved: 'Saved',
  orders: 'Orders',
};

// Icon mapping for MetricCard
const ICONS = {
  revenue: DollarSign,
  commission: Percent,
  vendors: Building2,
  pendingOrders: Package,
};

// MetricCard component
function MetricCard({ onClick, icon = 'revenue', label, value, subtext }) {
  const Icon = ICONS[icon] ?? DollarSign;

  const handleClick = (e) => {
    // Defend against parent handlers preventing default
    e.stopPropagation?.();
    // If this card ever sits inside a <form>, avoid accidental submits
    e.preventDefault?.();
    if (onClick) onClick();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      className="group min-w-[220px] cursor-pointer relative z-10 pointer-events-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      aria-label={`${label} – open page`}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">{value}</div>
          {subtext && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtext}</div>}
        </div>
        <Icon className="size-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
      </div>
    </div>
  );
}

// Unified Dashboard Component
function UnifiedDashboard({ setActiveDashboardTab }) {
  console.log('UnifiedDashboard component rendering');
  
  // Edit dashboard state
  const [isEditing, setIsEditing] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalRevenue: true,
    activeSuppliers: true,
    revenueChart: true,
    topSuppliers: true,
    regionDistribution: true,
    quickStats: true
  });

  // Portfolio filters state
  const [portfolioFilters, setPortfolioFilters] = useState({
    from: '2024-06-01',
    to: '2024-08-31',
    region: 'ALL',
    search: '',
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Portfolio data - with safe destructuring
  const portfolioRes = usePortfolioOverview(portfolioFilters) || {};
  const portfolioOverview = portfolioRes.data || {};
  const portfolioLoading = !!portfolioRes.loading;

  const suppliersRes = useSuppliers(portfolioFilters) || {};
  const suppliers = safeArray(suppliersRes.data);
  const suppliersLoading = !!suppliersRes.loading;

  const supplierDetailRes = useSupplierDetail(selectedSupplierId, portfolioFilters) || {};
  const supplierDetail = supplierDetailRes.data || null;
  const supplierDetailLoading = !!supplierDetailRes.loading;

  // Get the dominant region for suggestions
  const regionMix = safeArray(portfolioOverview?.regionMix);
  const dominantRegion = regionMix.length > 0 
    ? safeReduce(regionMix, (prev, current) => 
        (prev.revenue > current.revenue) ? prev : current
      )?.region || 'APAC'
    : 'APAC';

  const suggestionsRes = useSuggestions(dominantRegion, 3) || {};
  const suggestions = safeArray(suggestionsRes.data);
  const suggestionsLoading = !!suggestionsRes.loading;


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

  // Edit dashboard functions
  const toggleMetric = (metricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  const saveDashboard = () => {
    localStorage.setItem('dashboard-metrics', JSON.stringify(visibleMetrics));
    setIsEditing(false);
  };

  const resetDashboard = () => {
    const defaultMetrics = {
      totalRevenue: true,
      activeSuppliers: true,
      revenueChart: true,
      topSuppliers: true,
      regionDistribution: true,
      quickStats: true
    };
    setVisibleMetrics(defaultMetrics);
    localStorage.setItem('dashboard-metrics', JSON.stringify(defaultMetrics));
  };

  // Load saved metrics on component mount
  useEffect(() => {
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

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-emerald-900/20">
      <div className="p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Supply Center</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time overview of your supply chain operations and production portfolio</p>
        </motion.div>

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

            {/* Edit Dashboard Button */}
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
                    <Check size={16} />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-neutral-800/60 border border-white/20 dark:border-white/10 rounded-xl hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
                  >
                    <X size={16} />
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
                  <Edit3 size={16} />
                  Edit Dashboard
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards - Single Horizontal Row */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1" style={{ scrollSnapType: 'x mandatory' }}>
          <div className="flex gap-3 min-w-max">
            <MetricCard
              onClick={() => setActiveDashboardTab(TABS.finance)}
              icon="revenue"
              label="Total Revenue"
              value={portfolioLoading ? '...' : formatCurrency(Number(portfolioOverview?.totalRevenue) || 0)}
              subtext="+12.5%"
            />
            <MetricCard
              onClick={() => setActiveDashboardTab(TABS.finance)}
              icon="commission"
              label="Total Commission"
              value={portfolioLoading ? '...' : formatCurrency((Number(portfolioOverview?.totalRevenue) || 0) * 0.05)}
              subtext="5% of revenue"
            />
            <MetricCard
              onClick={() => setActiveDashboardTab(TABS.saved)}
              icon="vendors"
              label="Vendors"
              value={portfolioLoading ? '...' : (Number(portfolioOverview?.suppliers) || 0).toString()}
              subtext="Saved"
            />
            <MetricCard
              onClick={() => setActiveDashboardTab(TABS.orders)}
              icon="pendingOrders"
              label="Pending Orders"
              value={portfolioLoading ? '...' : (Number(portfolioOverview?.skus) || 0).toString()}
              subtext="Awaiting action"
            />
          </div>
        </div>


        {/* Portfolio Components */}
        <div className="space-y-8">

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">RegionDonut error</div>}>
              <RegionDonut 
                data={portfolioOverview} 
                loading={portfolioLoading} 
                onRegionClick={handleRegionClick}
              />
            </Try>
            <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">RevenueBySupplierBar error</div>}>
              <RevenueBySupplierBar 
                data={suppliers} 
                loading={suppliersLoading}
                onSupplierClick={handleSupplierClick}
              />
            </Try>
          </div>

          {/* Table and Suggestions Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">SuppliersTable error</div>}>
                <SuppliersTable 
                  data={suppliers} 
                  loading={suppliersLoading}
                  onSupplierClick={handleSupplierClick}
                />
              </Try>
            </div>
            <div>
              <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">Suggestions error</div>}>
                <Suggestions 
                  data={suggestions} 
                  loading={suggestionsLoading}
                  region={dominantRegion}
                />
              </Try>
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
  const [files, setFiles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  // Alibaba integration state
  const [config, setConfig] = useState({ featureAlibaba: false, alibabaEnabled: false });
  const [selectedSources, setSelectedSources] = useState(["internal"]);
  
  // Load config on component mount
  useEffect(() => {
    getAppConfig().then(setConfig);
  }, []);
  
  // Factory drawer and quote editor state
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Factory details hook
  const { loading: factoryLoading, data: factoryDetails, error: factoryError, load: loadFactoryDetails } = useFactoryDetails();

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
      setSearchResults(safeArray(data.results));
      
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
    setFiles([]);
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
    
    // Open drawer and load factory details
    setDrawerOpen(true);
    // Use factory_id if available, fallback to id for backward compatibility
    const factoryId = factory.factory_id || factory.id;
    console.debug("Open factory id:", factoryId);
    if (factoryId) {
      loadFactoryDetails(factoryId);
    }
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
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground mb-1">SLA Search</h2>
          <p className="text-sm text-muted-foreground">AI-Powered Factory Search</p>
        </div>
        
        <form onSubmit={handleSearch} className="space-y-3">
          {/* NEW: image drop field above the query input */}
          <ImageDropInput
            onAdd={(picked) => {
              // append to existing files; cap at 5 total
              setFiles((prev) => {
                const existing = safeArray(prev);
                const pickedArray = safeArray(picked);
                const combined = [...existing, ...pickedArray].slice(0, 5);
                return combined;
              });
            }}
          />
          
          {/* Optional: Tiny summary of selected files */}
          {safeArray(files).length > 0 && (
            <p className="text-xs opacity-70 mt-1 text-muted-foreground">
              {safeArray(files).length} image{safeArray(files).length>1?'s':''} selected.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Search Query
            </label>
            <textarea
              value={searchForm.query}
              onChange={(e) => updateForm("query", e.target.value)}
              placeholder="Describe what you're looking for... (e.g., 'cotton t-shirt factory in China with 100+ employees')"
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
              rows={2}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Location
            </label>
            <select 
              value={searchForm.location}
              onChange={(e) => updateForm("location", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm h-9"
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
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Product Type
            </label>
            <select 
              value={searchForm.industry}
              onChange={(e) => updateForm("industry", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm h-9"
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
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Factory Size
            </label>
            <select 
              value={searchForm.size}
              onChange={(e) => updateForm("size", e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm h-9"
            >
              <option value="">Any Size</option>
              <option value="small">Small (&lt;10K units/month)</option>
              <option value="medium">Medium (10K-100K units/month)</option>
              <option value="large">Large (100K-1M units/month)</option>
              <option value="enterprise">Enterprise (1M+ units/month)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Past Brand/Client
            </label>
            <input
              type="text"
              value={searchForm.brand}
              onChange={(e) => updateForm("brand", e.target.value)}
              placeholder="Enter brand name (e.g., Nike, H&M, Zara)"
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm h-9"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find factories that have worked with specific brands
            </p>
          </div>
          
          {/* Source Filter */}
          {config.featureAlibaba && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
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
            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring text-sm h-9"
          >
            {isSearching ? "Searching..." : "Search Factories"}
          </button>
          
          <button 
            type="button"
            onClick={handleClearFilters}
            className="w-full border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring text-sm h-8"
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
        <div className="flex-1 relative overflow-hidden">

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
                  <div className="h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Top Factory Matches</h3>
                      <button 
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-3 py-1.5 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                      >
                        Reset
                      </button>
                    </div>
                    
                    {safeArray(searchResults).length > 0 ? (
                      <ol className="space-y-3">
                        {safeArray(searchResults).map((result, i) => (
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
      <FactoryDetailsDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedFactory(null);
        }}
        factory={factoryDetails}
        loading={factoryLoading}
        inquiryPrefill={{
          inquiry_text: searchForm.query,
          product_type: searchForm.industry,
          origin_city: searchForm.location,
          origin_country_iso2: searchForm.location
        }}
        onQuoteCreated={(quote) => {
          console.log('Quote created:', quote);
          // Could show a toast notification here
        }}
      />
    </div>
  );
}
// Import other components
import ProductionPortfolio from "../pages/ProductionPortfolio";
import Saved from "../components/Saved";
import Fulfillment from "../components/Fulfillment";
import Orders from "../components/Orders";
import Finances from "../components/Finances";
import Integrations from "./Integrations";

export default function Dashboard({ 
  activeDashboardTab, 
  setActiveDashboardTab 
}) {
  console.log('Dashboard render - activeDashboardTab:', activeDashboardTab);

  return (
    <>
      {/* Debug banner */}
      <div className="fixed top-2 right-2 z-[9999] px-2 py-1 text-[10px] rounded bg-black/60 text-white">
        tab: {String(activeDashboardTab || 'undefined')} · v: {process.env.NODE_ENV} · {Date.now()}
      </div>
      
      {activeDashboardTab === 'Supply Center' && (
        <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">SupplyCenterPage error: Check console for details</div>}>
          <SupplyCenterPage setActiveDashboardTab={setActiveDashboardTab} />
        </Try>
      )}
      
      {activeDashboardTab === 'SLA Search' && (
        <Try fallback={<div className="p-4 bg-red-100 border border-red-300 rounded">SLAFactorySearch error: Check console for details</div>}>
          <SLAFactorySearch />
        </Try>
      )}
      
      {activeDashboardTab === 'Saved' && (
        <Saved />
      )}

      {activeDashboardTab === 'Fulfillment' && (
        <Fulfillment />
      )}

      {activeDashboardTab === 'Clients' && (
        <ClientsPage />
      )}

      {activeDashboardTab === 'Orders' && (
        <Orders />
      )}

      {activeDashboardTab === 'Finances' && (
        <Finances />
      )}

      {activeDashboardTab === 'Integrations' && (
        <Integrations />
      )}

      {activeDashboardTab === 'Production Portfolio' && (
        <ProductionPortfolio />
      )}

      {/* Fallback for unknown tabs */}
      {activeDashboardTab !== 'Dashboard' && 
       activeDashboardTab !== 'SLA Search' && 
       activeDashboardTab !== 'Production Portfolio' && 
       activeDashboardTab !== 'Saved' && 
       activeDashboardTab !== 'Fulfillment' && 
       activeDashboardTab !== 'Clients' && 
       activeDashboardTab !== 'Orders' && 
       activeDashboardTab !== 'Contacts' && 
       activeDashboardTab !== 'Finances' && 
       activeDashboardTab !== 'Integrations' && 
       activeDashboardTab !== 'Supply Center' && (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Tab not found</h2>
          <p className="text-gray-500">The tab "{activeDashboardTab}" is not implemented yet.</p>
        </div>
      )}
    </>
  );
}
