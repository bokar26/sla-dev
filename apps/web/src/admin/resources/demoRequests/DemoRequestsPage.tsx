import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";

interface DemoRequest {
  id: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  note?: string;
  status: string;
  org_id?: number;
  assignee_id?: number;
  created_at: string;
  resolved_at?: string;
  organization?: {
    id: number;
    name: string;
  };
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
}

const statusBadgeClass = (status?: string) => {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };
  return map[status ?? ''] || 'bg-muted text-muted-foreground';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

export default function DemoRequestsPage() {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchDemoRequests();
  }, [pagination.current, pagination.pageSize]);

  const fetchDemoRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/demo-requests?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDemoRequests(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch demo requests:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch demo requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Contact Name', 'Email', 'Phone', 'Company', 'Status', 'Created', 'Resolved'];
    const rows = demoRequests.map(dr => [
      dr.id,
      dr.contact_name,
      dr.contact_email,
      dr.contact_phone || '',
      dr.company_name || '',
      dr.status,
      formatDate(dr.created_at),
      formatDate(dr.resolved_at)
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demo-requests.csv';
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
      key: 'contact_name',
      title: 'Contact Name',
      dataIndex: 'contact_name',
    },
    {
      key: 'contact_email',
      title: 'Email',
      dataIndex: 'contact_email',
    },
    {
      key: 'contact_phone',
      title: 'Phone',
      dataIndex: 'contact_phone',
      render: (value: string) => value || '—',
    },
    {
      key: 'company_name',
      title: 'Company',
      dataIndex: 'company_name',
      render: (value: string) => value || '—',
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}>
          {status}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'resolved_at',
      title: 'Resolved',
      dataIndex: 'resolved_at',
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Demo Requests</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={demoRequests}
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