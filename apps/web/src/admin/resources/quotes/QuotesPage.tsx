import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";

interface Quote {
  id: number;
  sku: string;
  org_id: number;
  factory_id: number;
  qty: number;
  incoterm: string;
  est_unit_cost: number;
  margin: number;
  status: string;
  created_at: string;
  organization?: {
    id: number;
    name: string;
  };
  factory?: {
    id: number;
    name: string;
  };
}

const statusBadgeClass = (status?: string) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    calculated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    sent: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };
  return map[status ?? ''] || 'bg-muted text-muted-foreground';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchQuotes();
  }, [pagination.current, pagination.pageSize]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/quotes?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch quotes:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'SKU', 'Organization', 'Factory', 'Quantity', 'Incoterm', 'Unit Cost', 'Margin', 'Status', 'Created'];
    const rows = quotes.map(quote => [
      quote.id,
      quote.sku,
      quote.organization?.name || '',
      quote.factory?.name || '',
      quote.qty,
      quote.incoterm,
      formatCurrency(quote.est_unit_cost),
      formatPercentage(quote.margin),
      quote.status,
      formatDate(quote.created_at)
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.csv';
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
      key: 'sku',
      title: 'SKU',
      dataIndex: 'sku',
    },
    {
      key: 'organization',
      title: 'Organization',
      render: (value: any, record: Quote) => record.organization?.name || '—',
    },
    {
      key: 'factory',
      title: 'Factory',
      render: (value: any, record: Quote) => record.factory?.name || '—',
    },
    {
      key: 'qty',
      title: 'Quantity',
      dataIndex: 'qty',
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'incoterm',
      title: 'Incoterm',
      dataIndex: 'incoterm',
    },
    {
      key: 'est_unit_cost',
      title: 'Unit Cost',
      dataIndex: 'est_unit_cost',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'margin',
      title: 'Margin',
      dataIndex: 'margin',
      render: (value: number) => formatPercentage(value),
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quotes</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={quotes}
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