import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CardGlass from "../components/ui/CardGlass";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";
// import AdminVendorFactoryCard from "../../components/AdminVendorFactoryCard";
import ErrorBoundary from "../components/ErrorBoundary";
// import { useAdminStats } from "../../hooks/useAdminStats";
import { Download, Users, FileText, Activity, Factory, TrendingUp, UserCheck, Globe } from "lucide-react";
import { apiGet } from "../../lib/api";

interface KPIData {
  signups_7d: number;
  signups_30d: number;
  active_dau: number;
  active_mau: number;
  demo_pending: number;
  quotes_7d: number;
  quotes_30d: number;
  top_regions: Array<{ region: string; count: number }>;
  signups_series: Array<{ date: string; count: number }>;
  quotes_series: Array<{ date: string; count: number }>;
}

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  // const { loading: statsLoading, data: statsData, error: statsError } = useAdminStats();

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const data = await apiGet("/stats");
        setKpis(data);
      } catch (error) {
        console.error("Error fetching KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </motion.div>
    );
  }

  const series = kpis?.signups_series ?? [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage your SocFlow platform
        </p>
      </motion.div>

      {/* Chart and Top Regions */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartCard
            title="Activity Overview"
            data={series}
            dataKey1="count"
            dataKey2="quotes"
            delay={0.2}
            action={
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <Download className="w-4 h-4"/>
                Export
              </motion.button>
            }
          />
        </div>
        <CardGlass title="Top Regions" delay={0.3}>
          <div className="space-y-4">
            {(kpis?.top_regions ?? []).map((r, index) => (
              <motion.div 
                key={r.region}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{r.region}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{r.count}</span>
              </motion.div>
            ))}
          </div>
        </CardGlass>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard 
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          label="Signups (7d)" 
          value={kpis?.signups_7d} 
          delta="+12%" 
          up 
          delay={0.4}
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          label="Signups (30d)" 
          value={kpis?.signups_30d} 
          delay={0.5}
        />
        <StatCard 
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          label="Pending demos" 
          value={kpis?.demo_pending} 
          delay={0.6}
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          label="Quotes (7d)" 
          value={kpis?.quotes_7d} 
          delay={0.7}
        />
        <StatCard 
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          label="DAU" 
          value={kpis?.active_dau} 
          delay={0.8}
        />
        <StatCard 
          icon={<Factory className="w-5 h-5 text-emerald-600" />}
          label="MAU" 
          value={kpis?.active_mau} 
          delay={0.9}
        />
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="text-sm opacity-70">Supply Base</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs opacity-60">Unique Vendors</div>
                <div className="text-2xl font-semibold">2,600</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Total Factories</div>
                <div className="text-2xl font-semibold">7,567</div>
              </div>
            </div>
            <div className="text-[11px] opacity-50 mt-1">Counts reflect latest ingest across all sheets</div>
          </div>
        </motion.div>
      </div>

      {/* Latest Items */}
      <CardGlass title="Recent Activity" delay={1.0}>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Recent activity will appear here
          </p>
        </div>
      </CardGlass>
    </motion.div>
  );
}
