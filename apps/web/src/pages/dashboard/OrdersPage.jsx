import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Package, Truck, Calendar, AlertCircle } from 'lucide-react';
import UploadOrdersModal from '../../features/orders/UploadOrdersModal';
import { useOrdersStore } from '../../stores/ordersStore';
import { get } from '../../lib/http';

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openUpload, setOpenUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const { items, order, setAll } = useOrdersStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await get("/api/orders");
        setAll(data.items || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [setAll]);

  const orders = order.map(id => items[id]).filter(Boolean);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      (order.orderNo || order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client || order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.sku || order.product || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
                <p className="text-slate-600">Track and manage all your orders</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setOpenUpload(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Order
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:dark:text-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-slate-200 shadow-sm transition-colors">
                  <div className="p-6 border-b dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Orders</h2>
                  </div>
                  {loading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="mt-2 text-slate-500">Loading orders...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 transition-colors">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-900">{order.orderNo || order.orderNumber}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-medium text-slate-900">{order.client || order.customer}</div>
                                  <div className="text-sm text-slate-500">{order.vendor || order.factory}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-medium text-slate-900">{order.sku || order.product}</div>
                                  <div className="text-sm text-slate-500">Qty: {order.quantity}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-right">
                                  <div className="font-medium text-slate-900">${((order.quantity || 0) * (order.unitPrice || 0)).toLocaleString()}</div>
                                  <div className="text-sm text-slate-500">${order.unitPrice}/unit</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {order.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Order: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Truck className="w-3 h-3 text-slate-400" />
                                    <span>Ship: {order.expectedShipDate || 'N/A'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <button className="p-1 hover:bg-slate-100 rounded" title="View Details">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                  </button>
                                  <button className="p-1 hover:bg-slate-100 rounded" title="Edit Order">
                                    <Edit className="w-4 h-4 text-slate-400" />
                                  </button>
                                  <button className="p-1 hover:bg-slate-100 rounded text-red-500" title="Delete Order">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first order.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setOpenUpload(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Order
              </button>
            )}
          </div>
        )}
        
        <UploadOrdersModal open={openUpload} onOpenChange={setOpenUpload} />
      </div>
    </div>
  );
}
