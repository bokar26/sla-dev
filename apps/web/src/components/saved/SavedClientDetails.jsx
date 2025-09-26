import React, { useState } from 'react';
import { X, Mail, Phone, Globe, MapPin, Package, Building2, Tag, Calendar, Edit3, Trash2, Save } from 'lucide-react';
import { useUpdateClient } from '../../hooks/useClients';

export default function SavedClientDetails({ open, onOpenChange, client }) {
  const [activeTab, setActiveTab] = useState('data');
  const [notes, setNotes] = useState(client?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const { updateClient, loading: updateLoading } = useUpdateClient();

  const handleSaveNotes = async () => {
    if (!client) return;
    
    try {
      await updateClient(client.id, { notes });
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  if (!open || !client) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      quoted: 'bg-blue-100 text-blue-800',
      in_production: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={() => onOpenChange(false)}>
      <div className="ml-auto w-[600px] max-w-[95vw] h-full bg-white dark:bg-slate-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{client.name}</h2>
              <p className="text-sm text-neutral-500">Client Details</p>
            </div>
          </div>
          <button 
            className="text-neutral-400 hover:text-neutral-600" 
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'data' ? (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-neutral-500" />
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {client.website}
                      </a>
                    </div>
                  )}
                  {client.primaryContact && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">Contact:</span>
                      <span className="text-neutral-600">{client.primaryContact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              {client.addresses && client.addresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Addresses</h3>
                  <div className="space-y-3">
                    {client.addresses.map((address) => (
                      <div key={address.id} className="bg-neutral-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-900">
                            {address.label || 'Address'}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600 space-y-1">
                          <div>{address.line1}</div>
                          {address.line2 && <div>{address.line2}</div>}
                          <div>{address.city}, {address.state} {address.postalCode}</div>
                          <div>{address.country}</div>
                          {address.phone && <div className="mt-2">{address.phone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {client.orders && client.orders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Orders</h3>
                  <div className="bg-neutral-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Order #</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">SKUs</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Total</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.orders.map((order) => (
                          <tr key={order.id} className="border-t border-neutral-200">
                            <td className="px-3 py-2 text-neutral-900">{order.orderNumber}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-neutral-600">{order.skuCount}</td>
                            <td className="px-3 py-2 text-neutral-600">
                              {order.totalCost ? `$${order.totalCost.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-neutral-600">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Vendors Used */}
              {client.vendorsUsed && client.vendorsUsed.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Vendors Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {client.vendorsUsed.map((vendor, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                        {vendor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {client.tags && client.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-500">Created:</span>
                    <span className="text-neutral-600">{formatDate(client.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-500">Updated:</span>
                    <span className="text-neutral-600">{formatDate(client.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Notes Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Notes</h3>
                <div className="flex items-center gap-2">
                  {isEditingNotes ? (
                    <>
                      <button
                        onClick={handleSaveNotes}
                        disabled={updateLoading}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {updateLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setNotes(client.notes || '');
                          setIsEditingNotes(false);
                        }}
                        className="px-3 py-1 text-xs rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              {isEditingNotes ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-32 p-3 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Add notes about this client..."
                />
              ) : (
                <div className="min-h-32 p-3 bg-neutral-50 rounded-lg">
                  {client.notes ? (
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-sm text-neutral-500 italic">No notes added yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
