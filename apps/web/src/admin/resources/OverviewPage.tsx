import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCustom } from '@refinedev/core';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  FileText, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  Globe,
  Building2,
  UserCheck,
  Calendar
} from 'lucide-react';
import CardGlass from '../components/ui/CardGlass';
import StatCard from '../components/ui/StatCard';
import ChartCard from '../components/ui/ChartCard';
import AvatarStack from '../components/ui/AvatarStack';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';

interface KPIData {
  signups_7d: number;
  signups_30d: number;
  active_dau: number;
  active_mau: number;
  demo_pending: number;
  quotes_7d: number;
  quotes_30d: number;
  top_regions: Array<{ region: string; count: number }>;
  errors_7d: number;
  signups_series?: Array<{ date: string; count: number }>;
  quotes_series?: Array<{ date: string; count: number }>;
}

export default function OverviewPage() {
  const { data: kpiData, isLoading: loading, error } = useCustom<KPIData>({
    url: '/api/admin/kpis',
    method: 'get',
  });

  console.log("📊 OverviewPage rendering", { loading, hasData: !!kpiData, error });

  const handleExportChart = () => {
    // Implement chart export functionality
    console.log('Exporting chart data...');
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
  };

  // Mock data for latest items table
  const latestItems = [
    {
      id: 1,
      type: 'Demo Request',
      name: 'Acme Corp',
      status: 'pending',
      progress: 25,
      date: '2025-09-13',
      assignee: 'John Doe'
    },
    {
      id: 2,
      type: 'Quote',
      name: 'TechStart Inc',
      status: 'approved',
      progress: 100,
      date: '2025-09-12',
      assignee: 'Jane Smith'
    },
    {
      id: 3,
      type: 'Factory',
      name: 'Global Manufacturing',
      status: 'active',
      progress: 75,
      date: '2025-09-11',
      assignee: 'Mike Johnson'
    }
  ];

  const tableColumns = [
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {value}
        </span>
      )
    },
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      render: (value: string, record: any) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{record.date}</div>
        </div>
      )
    },
    {
      key: 'progress',
      title: 'Progress',
      dataIndex: 'progress',
      render: (value: number) => (
        <div className="w-20">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{value}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'assignee',
      title: 'Assignee',
      dataIndex: 'assignee',
      render: (value: string) => (
        <AvatarStack 
          avatars={[{ id: '1', name: value, fallback: value.charAt(0) }]}
          size="sm"
        />
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
        <div className="text-red-600">
          <p>Error loading dashboard data: {error.message}</p>
          <p className="text-sm mt-2">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
        <p>No data available yet. Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Chart and Top Performance */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Activity Overview"
            data={kpiData?.signups_series || []}
            primaryKey="count"
            primaryLabel="Signups"
            onExport={handleExportChart}
          />
        </div>

        {/* Top Performance Card */}
        <div className="lg:col-span-1">
          <CardGlass title="Top Performance">
            <div className="space-y-4">
              {kpiData?.top_regions?.slice(0, 5).map((region, index) => (
                <motion.div
                  key={region.region}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{region.region}</p>
                      <p className="text-xs text-muted-foreground">Region</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {region.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardGlass>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="New Signups (7d)"
          value={kpiData?.signups_7d || 0}
          delta="+12%"
          deltaType="up"
          icon={Users}
        />
        <StatCard
          label="New Signups (30d)"
          value={kpiData?.signups_30d || 0}
          delta="+8%"
          deltaType="up"
          icon={TrendingUp}
        />
        <StatCard
          label="Daily Active Users"
          value={kpiData?.active_dau || 0}
          delta="+5%"
          deltaType="up"
          icon={Activity}
        />
        <StatCard
          label="Monthly Active Users"
          value={kpiData?.active_mau || 0}
          delta="+15%"
          deltaType="up"
          icon={BarChart3}
        />
        <StatCard
          label="Pending Demos"
          value={kpiData?.demo_pending || 0}
          delta="3 new"
          deltaType="neutral"
          icon={FileText}
        />
        <StatCard
          label="Quotes (7d)"
          value={kpiData?.quotes_7d || 0}
          delta="+22%"
          deltaType="up"
          icon={DollarSign}
        />
      </div>

      {/* Latest Items Table */}
      <CardGlass title="Latest Activity">
        <DataTable
          columns={tableColumns}
          data={latestItems}
          searchable={false}
          exportable={false}
        />
      </CardGlass>

      {/* Quick Actions */}
      <CardGlass title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('users')}
            className="
              p-4 rounded-lg border border-border/50
              hover:bg-muted/50 transition-colors
              focus-visible:ring-2 focus-visible:ring-emerald-500
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">View All Users</p>
                <p className="text-xs text-muted-foreground">Manage user accounts</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('factories')}
            className="
              p-4 rounded-lg border border-border/50
              hover:bg-muted/50 transition-colors
              focus-visible:ring-2 focus-visible:ring-emerald-500
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Manage Factories</p>
                <p className="text-xs text-muted-foreground">Factory operations</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('demos')}
            className="
              p-4 rounded-lg border border-border/50
              hover:bg-muted/50 transition-colors
              focus-visible:ring-2 focus-visible:ring-emerald-500
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Demo Requests</p>
                <p className="text-xs text-muted-foreground">Review pending demos</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('reports')}
            className="
              p-4 rounded-lg border border-border/50
              hover:bg-muted/50 transition-colors
              focus-visible:ring-2 focus-visible:ring-emerald-500
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">View Reports</p>
                <p className="text-xs text-muted-foreground">Analytics & insights</p>
              </div>
            </div>
          </motion.button>
        </div>
      </CardGlass>
    </div>
  );
}
