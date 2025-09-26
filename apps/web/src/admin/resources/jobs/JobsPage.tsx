import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";
import { RotateCcw } from "lucide-react";

interface Job {
  id: number;
  type: string;
  status: string;
  payload: any;
  error?: string;
  started_at: string;
  finished_at?: string;
  retry_count?: number;
  max_retries?: number;
}

const statusBadgeClass = (status?: string) => {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    cancelled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  };
  return map[status ?? ''] || 'bg-muted text-muted-foreground';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString();
};

const truncate = (text: string, maxLength: number = 50) => {
  if (!text) return '—';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchJobs();
  }, [pagination.current, pagination.pageSize]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/jobs?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch jobs:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/api/admin/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchJobs(); // Refresh the list
      } else {
        alert('Failed to retry job');
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert('Failed to retry job');
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Type', 'Status', 'Started', 'Finished', 'Error', 'Retry Count'];
    const rows = jobs.map(job => [
      job.id,
      job.type,
      job.status,
      formatDateTime(job.started_at),
      formatDateTime(job.finished_at),
      job.error || '',
      job.retry_count || 0
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jobs.csv';
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
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
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
      key: 'started_at',
      title: 'Started',
      dataIndex: 'started_at',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'finished_at',
      title: 'Finished',
      dataIndex: 'finished_at',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'error',
      title: 'Error',
      dataIndex: 'error',
      render: (error: string) => (
        <span className="text-red-600 dark:text-red-400" title={error}>
          {truncate(error)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Job) => (
        <button
          onClick={() => handleRetry(record.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 ring-brand"
          disabled={record.status === 'running'}
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={jobs}
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