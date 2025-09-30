import React, { useEffect, useState } from "react";
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
  errors_7d: number;
  signups_series: Array<{ date: string; count: number }>;
  quotes_series: Array<{ date: string; count: number }>;
}

export default function SimpleOverviewPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/stats");
      setKpis(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch KPIs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-yellow-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Data</h3>
            <p className="text-sm text-yellow-700 mt-1">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Key metrics and insights for SLA platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Signups (7d)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.signups_7d}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Signups (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.signups_30d}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users (DAU)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.active_dau}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users (MAU)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.active_mau}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Demos</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.demo_pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quotes (7d)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.quotes_7d}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quotes (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.quotes_30d}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Errors (7d)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.errors_7d}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Signups Trend (Last 7 Days)</h3>
          <div className="space-y-2">
            {kpis.signups_series.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.date}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (item.count / Math.max(...kpis.signups_series.map(s => s.count), 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quotes Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotes Trend (Last 7 Days)</h3>
          <div className="space-y-2">
            {kpis.quotes_series.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.date}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (item.count / Math.max(...kpis.quotes_series.map(s => s.count), 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Regions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Regions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.top_regions.map((region, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{region.region}</span>
              <span className="text-sm text-gray-600">{region.count} organizations</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
