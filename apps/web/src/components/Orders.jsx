import React, { useState, useEffect } from 'react';
import { CardGlass, DataTable } from '../user/components/UiKit';
import SleekButton from './ui/SleekButton';
import { 
  ShoppingCart, 
  Upload, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Mock orders data
  const mockOrders = [
    {
      id: 'ORD-001',
      orderNumber: 'PO-2024-001',
      customer: 'TechCorp Inc.',
      factory: 'Shenzhen Electronics Co.',
      product: 'Smartphone Cases',
      quantity: 1000,
      unitPrice: 8.50,
      total: 8500,
      status: 'fulfilled',
      orderDate: '2024-01-15',
      deliveryDate: '2024-02-15',
      priority: 'high',
      notes: 'Rush order for product launch'
    },
    {
      id: 'ORD-002',
      orderNumber: 'PO-2024-002',
      customer: 'Fashion Forward',
      factory: 'Bangkok Textiles Ltd.',
      product: 'Cotton T-Shirts',
      quantity: 500,
      unitPrice: 5.00,
      total: 2500,
      status: 'in_progress',
      orderDate: '2024-01-20',
      deliveryDate: '2024-02-20',
      priority: 'medium',
      notes: 'Custom logo printing required'
    },
    {
      id: 'ORD-003',
      orderNumber: 'PO-2024-003',
      customer: 'Sports Gear Co.',
      factory: 'Jakarta Manufacturing',
      product: 'Running Shoes',
      quantity: 200,
      unitPrice: 25.00,
      total: 5000,
      status: 'pending',
      orderDate: '2024-01-25',
      deliveryDate: '2024-03-01',
      priority: 'low',
      notes: 'Sample approval pending'
    },
    {
      id: 'ORD-004',
      orderNumber: 'PO-2024-004',
      customer: 'Home Decor Plus',
      factory: 'Shenzhen Electronics Co.',
      product: 'LED Light Strips',
      quantity: 800,
      unitPrice: 12.00,
      total: 9600,
      status: 'cancelled',
      orderDate: '2024-01-10',
      deliveryDate: '2024-02-10',
      priority: 'medium',
      notes: 'Customer cancelled due to budget constraints'
    }
  ];

  useEffect(() => {
    // Load orders from localStorage or use mock data
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (savedOrders.length > 0) {
      setOrders(savedOrders);
    } else {
      setOrders(mockOrders);
      localStorage.setItem('orders', JSON.stringify(mockOrders));
    }
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.factory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status) => {
    const base = "w-4 h-4";
    switch (status) {
      case 'fulfilled':
        return <CheckCircle className={`${base} text-emerald-600 dark:text-emerald-400`} />;
      case 'in_progress':
        return <Clock className={`${base} text-blue-600 dark:text-blue-400`} />;
      case 'pending':
        return <AlertCircle className={`${base} text-amber-600 dark:text-amber-400`} />;
      case 'cancelled':
        return <XCircle className={`${base} text-rose-600 dark:text-rose-400`} />;
      default:
        return <Package className={`${base} text-muted-foreground`} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default:
        return 'bg-muted text-foreground/80';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'low':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-muted text-foreground/80';
    }
  };

  const handleAddOrder = () => {
    setShowAddOrder(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleDeleteOrder = (orderId) => {
    const updatedOrders = orders.filter(order => order.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  const exportOrders = () => {
    const csvContent = [
      ['Order ID', 'Order Number', 'Customer', 'Factory', 'Product', 'Quantity', 'Unit Price', 'Total', 'Status', 'Order Date', 'Delivery Date', 'Priority'],
      ...filteredOrders.map(order => [
        order.id,
        order.orderNumber,
        order.customer,
        order.factory,
        order.product,
        order.quantity,
        order.unitPrice,
        order.total,
        order.status,
        order.orderDate,
        order.deliveryDate,
        order.priority
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Define columns for DataTable
  const columns = [
    {
      key: 'order',
      title: 'Order',
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-foreground">{order.orderNumber}</div>
          <div className="text-sm text-muted-foreground">{order.id}</div>
        </div>
      )
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (order) => <div className="text-sm text-foreground">{order.customer}</div>
    },
    {
      key: 'factory',
      title: 'Factory',
      render: (order) => <div className="text-sm text-foreground">{order.factory}</div>
    },
    {
      key: 'product',
      title: 'Product',
      render: (order) => <div className="text-sm text-foreground">{order.product}</div>
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (order) => <div className="text-sm text-foreground">{order.quantity.toLocaleString()}</div>
    },
    {
      key: 'total',
      title: 'Total',
      render: (order) => <div className="text-sm font-medium text-foreground">${order.total.toLocaleString()}</div>
    },
    {
      key: 'status',
      title: 'Status',
      render: (order) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (order) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
          {order.priority}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (order) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewOrder(order)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 focus-visible:ring-2 ring-ring"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteOrder(order.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus-visible:ring-2 ring-ring"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 text-foreground">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-xl">
                <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders Management</h1>
                <p className="text-muted-foreground">Track and manage all your orders</p>
              </div>
            </div>
            <div className="flex gap-3">
              <SleekButton
                variant="outline"
                onClick={exportOrders}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </SleekButton>
              <SleekButton
                variant="primary"
                onClick={handleAddOrder}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Order
              </SleekButton>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus-visible:ring-2 ring-ring focus-visible:outline-none transition-all duration-200 ease-smooth"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-xl focus-visible:ring-2 ring-ring focus-visible:outline-none transition-all duration-200 ease-smooth"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <CardGlass title="Orders">
          <DataTable
            columns={columns}
            data={filteredOrders}
            loading={false}
            searchable={false}
            exportable={false}
          />
        </CardGlass>

        {filteredOrders.length === 0 && (
          <CardGlass>
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first order'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleAddOrder}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus-visible:ring-2 ring-ring transition-colors"
                >
                  Add Order
                </button>
              )}
            </div>
          </CardGlass>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card text-card-foreground rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Order Details</h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Order Number</label>
                    <p className="text-sm text-foreground">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Order ID</label>
                    <p className="text-sm text-foreground">{selectedOrder.id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Customer</label>
                    <p className="text-sm text-foreground">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Factory</label>
                    <p className="text-sm text-foreground">{selectedOrder.factory}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Product</label>
                  <p className="text-sm text-foreground">{selectedOrder.product}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-sm text-foreground">{selectedOrder.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Unit Price</label>
                    <p className="text-sm text-foreground">${selectedOrder.unitPrice}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Total</label>
                    <p className="text-sm font-bold text-foreground">${selectedOrder.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Order Date</label>
                    <p className="text-sm text-foreground">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Delivery Date</label>
                    <p className="text-sm text-foreground">{selectedOrder.deliveryDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrder.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                      {selectedOrder.priority}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm text-foreground">{selectedOrder.notes}</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="flex-1 bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 focus-visible:ring-2 ring-ring transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Handle edit order
                    setShowOrderDetails(false);
                  }}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus-visible:ring-2 ring-ring transition-colors"
                >
                  Edit Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
