import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";
import { RotateCcw } from "lucide-react";

interface WebhookEvent {
  id: number;
  provider: string;
  event_type: string;
  payload: any;
  status: string;
  retry_count?: number;
  last_retry_at?: string;
  created_at: string;
}

const statusBadgeClass = (status?: string) => {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    retrying: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  };
  return map[status ?? ''] || 'bg-muted text-muted-foreground';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString();
};

const truncate = (text: string, maxLength: number = 50) => {
  if (!text) return '—';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export default function WebhooksPage() {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchWebhookEvents();
  }, [pagination.current, pagination.pageSize]);

  const fetchWebhookEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/webhook-events?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setWebhookEvents(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch webhook events:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch webhook events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (eventId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/api/admin/webhook-events/${eventId}/replay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchWebhookEvents(); // Refresh the list
      } else {
        alert('Failed to replay webhook event');
      }
    } catch (error) {
      console.error('Failed to replay webhook event:', error);
      alert('Failed to replay webhook event');
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Provider', 'Event Type', 'Status', 'Retry Count', 'Created'];
    const rows = webhookEvents.map(event => [
      event.id,
      event.provider,
      event.event_type,
      event.status,
      event.retry_count || 0,
      formatDate(event.created_at)
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webhook-events.csv';
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
      key: 'provider',
      title: 'Provider',
      dataIndex: 'provider',
    },
    {
      key: 'event_type',
      title: 'Event Type',
      dataIndex: 'event_type',
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
      key: 'retry_count',
      title: 'Retries',
      dataIndex: 'retry_count',
      render: (count: number) => count || 0,
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: WebhookEvent) => (
        <button
          onClick={() => handleReplay(record.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 ring-brand"
        >
          <RotateCcw className="w-3 h-3" />
          Replay
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Webhooks</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={webhookEvents}
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