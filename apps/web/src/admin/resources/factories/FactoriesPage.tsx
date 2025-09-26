import React, { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import CardGlass from "../../components/ui/CardGlass";

interface Factory {
  id: number;
  name: string;
  country: string;
  city: string;
  certifications: string[];
  moq: number;
  lead_time_days: number;
  rating: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  created_at: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

const formatRating = (rating: number) => {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '☆' : '');
};

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchFactories();
  }, [pagination.current, pagination.pageSize]);

  const fetchFactories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/factories?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFactories(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch factories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch factories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Country', 'City', 'Certifications', 'MOQ', 'Lead Time (days)', 'Rating', 'Contact Email', 'Website'];
    const rows = factories.map(factory => [
      factory.id,
      factory.name,
      factory.country,
      factory.city,
      factory.certifications.join(', '),
      factory.moq,
      factory.lead_time_days,
      factory.rating,
      factory.contact_email || '',
      factory.website || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factories.csv';
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
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
    },
    {
      key: 'country',
      title: 'Country',
      dataIndex: 'country',
    },
    {
      key: 'certifications',
      title: 'Certifications',
      dataIndex: 'certifications',
      render: (certifications: string[]) => (
        <span className="text-sm text-muted-foreground">
          {certifications.length} certs
        </span>
      ),
    },
    {
      key: 'moq',
      title: 'MOQ',
      dataIndex: 'moq',
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'lead_time_days',
      title: 'Lead Time',
      dataIndex: 'lead_time_days',
      render: (value: number) => `${value} days`,
    },
    {
      key: 'rating',
      title: 'Rating',
      dataIndex: 'rating',
      render: (rating: number) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">{formatRating(rating)}</span>
          <span className="text-sm text-muted-foreground">({rating})</span>
        </div>
      ),
    },
    {
      key: 'contact_email',
      title: 'Contact',
      dataIndex: 'contact_email',
      render: (value: string) => value || '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Factories</h1>
      </div>

      <CardGlass>
        <DataTable
          columns={columns}
          data={factories}
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