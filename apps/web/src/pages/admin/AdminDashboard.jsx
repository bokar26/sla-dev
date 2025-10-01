import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Colors for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];

// Local inline placeholder to unblock builds. Replace later with the real component file.
function DangerZoneFactoryReset({ onReset }) {
  return (
    <div className="rounded-xl border border-red-300/50 bg-red-50 p-4">
      <h3 className="text-red-700 font-semibold">Danger Zone</h3>
      <p className="text-red-600/80 text-sm mt-1">
        This will clear cached factory analytics and refresh admin data (placeholder component).
      </p>
      <div className="mt-3">
        <button
          type="button"
          className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          onClick={() => onReset?.()}
          aria-label="Reset factory analytics cache"
        >
          Reset Factory Analytics Cache
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const navigate = useNavigate();

  // Check admin authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/admin/me`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const data = await response.json();
      setAdminInfo(data);
    } catch (err) {
      console.error('Auth check failed:', err);
      navigate('/');
    }
  };

  // Load metrics
  useEffect(() => {
    if (adminInfo) {
      loadMetrics();
    }
  }, [adminInfo]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/metrics`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!adminInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Vendor & Factory Analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {adminInfo.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load metrics
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={loadMetrics}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-400"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Factories</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(metrics.totals.totalFactories)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unique Vendors</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(metrics.totals.uniqueVendors)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Countries</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {metrics.totals.countries}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Countries Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Top Countries by Factory Count
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byCountry.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="country" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [formatNumber(value), 'Factories']}
                      labelStyle={{ color: '#1e293b' }}
                      contentStyle={{ 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ingestion Status Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Factory Status Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.byIngestionStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.byIngestionStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Factories']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading metrics...</p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Last Updated */}
        {metrics && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: {new Date(metrics.updatedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Danger Zone</h2>
          <DangerZoneFactoryReset />
        </div>
      </main>
    </div>
  );
}
