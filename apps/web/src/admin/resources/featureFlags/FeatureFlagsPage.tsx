import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";

interface FeatureFlag {
  id: number;
  key: string;
  description: string;
  enabled_global: boolean;
  enabled_orgs: number[];
  created_at: string;
  updated_at: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

export default function FeatureFlagsPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchFeatureFlags();
  }, [pagination.current, pagination.pageSize]);

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/feature-flags?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFeatureFlags(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch feature flags:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flagId: number, currentEnabled: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/api/admin/feature-flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled_global: !currentEnabled
        }),
      });
      
      if (response.ok) {
        fetchFeatureFlags(); // Refresh the list
      } else {
        alert('Failed to update feature flag');
      }
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      alert('Failed to update feature flag');
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Key', 'Description', 'Enabled Global', 'Enabled Orgs', 'Created', 'Updated'];
    const rows = featureFlags.map(flag => [
      flag.id,
      flag.key,
      flag.description,
      flag.enabled_global ? 'Yes' : 'No',
      flag.enabled_orgs.join(', '),
      formatDate(flag.created_at),
      formatDate(flag.updated_at)
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature-flags.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      key: 'key',
      title: 'Key',
      dataIndex: 'key',
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
    },
    {
      key: 'enabled_global',
      title: 'Enabled',
      dataIndex: 'enabled_global',
      render: (enabled: boolean, record: FeatureFlag) => (
        <button
          onClick={() => handleToggle(record.id, enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 ring-brand ${
            enabled ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'enabled_orgs',
      title: 'Enabled Orgs',
      dataIndex: 'enabled_orgs',
      render: (orgs: number[]) => (
        <span className="text-sm text-muted-foreground">
          {orgs.length} orgs
        </span>
      ),
    },
    {
      key: 'updated_at',
      title: 'Updated',
      dataIndex: 'updated_at',
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Feature Flags</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={featureFlags}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }
          }}
          searchable
          onSearch={handleSearch}
          exportable
          onExport={handleExport}
        />
      </CardGlass>
    </div>
  );
}