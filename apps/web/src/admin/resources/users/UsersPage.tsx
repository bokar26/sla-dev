import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Building2, Phone, Globe, Users, DollarSign, FileText, Eye } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import CardGlass from '../../components/ui/CardGlass';
import AvatarStack from '../../components/ui/AvatarStack';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_seen_at?: string;
  organization?: {
    id: number;
    name: string;
    plan: string;
    region: string;
  };
  demo_requests?: DemoRequest[];
}

interface DemoRequest {
  id: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  note?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

// Helper functions
const getLatestDemo = (u: User): DemoRequest | undefined => {
  const list = u.demo_requests ?? [];
  if (!list.length) return undefined;
  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
};

const statusBadgeClass = (status?: string) => {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };
  return map[status ?? ''] || 'bg-muted text-muted-foreground';
};

const truncate = (val?: string, n = 60) =>
  !val ? '—' : val.length > n ? `${val.slice(0, n)}…` : val;

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `http://localhost:8000/api/admin/users?page=${pagination.current}&size=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    // TODO: Implement edit user modal
    console.log('Edit user:', user);
    alert(`Edit user: ${user.name} (${user.email})`);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`http://localhost:8000/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          fetchUsers(); // Refresh the list
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleAdd = () => {
    // TODO: Implement add user modal
    console.log('Add new user');
    alert('Add new user functionality coming soon!');
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search
    console.log('Search:', value);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Organization', 'Contact Name', 'Contact Email', 'Contact Phone', 'Company', 'Status', 'Created', 'Resolved'];
    const rows = users.map(user => {
      const demo = getLatestDemo(user);
      return [
        user.id,
        user.name,
        user.email,
        user.role,
        user.organization?.name || '',
        demo?.contact_name || '',
        demo?.contact_email || '',
        demo?.contact_phone || '',
        demo?.company_name || '',
        demo?.status || '',
        demo ? formatDate(demo.created_at) : '',
        demo ? formatDate(demo.resolved_at) : ''
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = (user: User) => {
    // Show demo request details
    const demoRequests = user.demo_requests || [];
    if (demoRequests.length === 0) {
      alert('No demo requests found for this user.');
      return;
    }
    
    const latestDemo = demoRequests[0];
    const details = `
Demo Request Details:
- Contact: ${latestDemo.contact_name || 'N/A'}
- Email: ${latestDemo.contact_email || 'N/A'}
- Phone: ${latestDemo.contact_phone || 'N/A'}
- Company: ${latestDemo.company_name || 'N/A'}
- Status: ${latestDemo.status}
- Created: ${new Date(latestDemo.created_at).toLocaleString()}
- Note: ${latestDemo.note || 'No notes'}
    `;
    alert(details);
  };

  // --- COLUMNS: Demo Request fields per user ---
  const columns = [
    {
      key: 'user',
      title: 'User',
      dataIndex: 'name',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {(record.name || record.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-foreground">{record.name || '—'}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      title: 'Company',
      dataIndex: 'organization',
      render: (_: any, record: User) => {
        const demo = getLatestDemo(record);
        const company = demo?.company_name || record.organization?.name || '—';
        return (
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span className="font-medium">{company}</span>
          </div>
        );
      }
    },
    {
      key: 'contact_name',
      title: 'Contact name',
      dataIndex: 'demo_requests',
      render: (_: any, record: User) => getLatestDemo(record)?.contact_name || '—',
    },
    {
      key: 'contact_email',
      title: 'Contact email',
      dataIndex: 'demo_requests',
      render: (_: any, record: User) => getLatestDemo(record)?.contact_email || '—',
    },
    {
      key: 'contact_phone',
      title: 'Contact phone',
      dataIndex: 'demo_requests',
      render: (_: any, record: User) => getLatestDemo(record)?.contact_phone || '—',
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'demo_requests',
      sortable: true,
      render: (_: any, record: User) => {
        const s = getLatestDemo(record)?.status;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(s)}`}>
            <FileText className="w-3 h-3" />
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'}
          </span>
        );
      },
    },
    {
      key: 'submitted',
      title: 'Submitted',
      dataIndex: 'demo_requests',
      sortable: true,
      render: (_: any, record: User) => {
        const dt = getLatestDemo(record)?.created_at;
        return dt ? new Date(dt).toLocaleString() : '—';
      },
    },
    {
      key: 'resolved',
      title: 'Resolved',
      dataIndex: 'demo_requests',
      render: (_: any, record: User) => {
        const dt = getLatestDemo(record)?.resolved_at;
        return dt ? new Date(dt).toLocaleString() : '—';
      },
    },
    {
      key: 'region',
      title: 'Region',
      dataIndex: 'organization',
      render: (_: any, record: User) => record.organization?.region || '—',
    },
    {
      key: 'note',
      title: 'Notes',
      dataIndex: 'demo_requests',
      render: (_: any, record: User) => {
        const note = getLatestDemo(record)?.note;
        return (
          <span title={note || ''} className="text-muted-foreground">
            {truncate(note)}
          </span>
        );
      },
      width: 260,
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Users</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Users</h1>
        <p>No users found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CardGlass title="User Management">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page: number, pageSize: number) => {
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
