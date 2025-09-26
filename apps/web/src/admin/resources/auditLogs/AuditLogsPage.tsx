import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";
import { Eye } from "lucide-react";

interface AuditLog {
  id: number;
  actor_user_id: number;
  entity: string;
  entity_id: string;
  action: string;
  before?: any;
  after?: any;
  ip_address?: string;
  user_agent?: string;
  at: string;
  actor_user?: {
    id: number;
    name: string;
    email: string;
  };
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString();
};

const truncate = (text: string, maxLength: number = 30) => {
  if (!text) return '—';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.current, pagination.pageSize]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/audit-logs?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch audit logs:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'When', 'Actor', 'Entity', 'Entity ID', 'Action', 'IP Address'];
    const rows = auditLogs.map(log => [
      log.id,
      formatDate(log.at),
      log.actor_user?.name || '',
      log.entity,
      log.entity_id,
      log.action,
      log.ip_address || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
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
      key: 'at',
      title: 'When',
      dataIndex: 'at',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'actor_user',
      title: 'Actor',
      render: (value: any, record: AuditLog) => record.actor_user?.name || '—',
    },
    {
      key: 'entity',
      title: 'Entity',
      dataIndex: 'entity',
    },
    {
      key: 'entity_id',
      title: 'Entity ID',
      dataIndex: 'entity_id',
      render: (value: string) => truncate(value),
    },
    {
      key: 'action',
      title: 'Action',
      dataIndex: 'action',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: AuditLog) => (
        <button
          onClick={() => handleViewDetails(record)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 ring-brand"
        >
          <Eye className="w-3 h-3" />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={auditLogs}
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

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Actor</label>
                <p className="text-sm">{selectedLog.actor_user?.name} ({selectedLog.actor_user?.email})</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Action</label>
                <p className="text-sm">{selectedLog.action} on {selectedLog.entity} #{selectedLog.entity_id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">When</label>
                <p className="text-sm">{formatDate(selectedLog.at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <p className="text-sm">{selectedLog.ip_address || '—'}</p>
              </div>
              
              {selectedLog.before && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Before</label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.after && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">After</label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}