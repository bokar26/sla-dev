import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  ChevronDown, 
  FileText, 
  Link as LinkIcon, 
  Tag,
  Edit,
  Trash2,
  Save,
  X,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function CustomersPanel({ 
  customers = [], 
  addCustomer, 
  updateCustomer, 
  removeCustomer, 
  addNote, 
  updateNote, 
  removeNote 
}) {
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    region: '',
    products: [],
    contact: { name: '', email: '', phone: '' },
    tags: [],
    relationship: 'prospect'
  });
  const [newNote, setNewNote] = useState('');

  const toggleExpanded = (customerId) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleAddCustomer = () => {
    if (newCustomer.name.trim()) {
      const customer = {
        ...newCustomer,
        id: crypto.randomUUID(),
        products: newCustomer.products.filter(p => p.trim()),
        tags: newCustomer.tags.filter(t => t.trim())
      };
      addCustomer(customer);
      setNewCustomer({
        name: '',
        region: '',
        products: [],
        contact: { name: '', email: '', phone: '' },
        tags: [],
        relationship: 'prospect'
      });
    }
  };

  const handleUpdateCustomer = (customerId, updates) => {
    updateCustomer(customerId, updates);
    setEditingCustomer(null);
  };

  const handleRemoveCustomer = (customerId) => {
    if (confirm('Are you sure you want to remove this customer?')) {
      removeCustomer(customerId);
    }
  };

  const handleAddNote = (customerId) => {
    if (newNote.trim()) {
      addNote(customerId, newNote);
      setNewNote('');
    }
  };

  const handleUpdateNote = (customerId, noteId, content) => {
    updateNote(customerId, noteId, content);
    setEditingNote(null);
  };

  const handleRemoveNote = (customerId, noteId) => {
    if (confirm('Are you sure you want to remove this note?')) {
      removeNote(customerId, noteId);
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'prospect':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Customer */}
      <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Customer
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
            <input
              type="text"
              placeholder="Region"
              value={newCustomer.region}
              onChange={(e) => setNewCustomer({ ...newCustomer, region: e.target.value })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={newCustomer.contact.name}
              onChange={(e) => setNewCustomer({ 
                ...newCustomer, 
                contact: { ...newCustomer.contact, name: e.target.value }
              })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
            <input
              type="email"
              placeholder="Email"
              value={newCustomer.contact.email}
              onChange={(e) => setNewCustomer({ 
                ...newCustomer, 
                contact: { ...newCustomer.contact, email: e.target.value }
              })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newCustomer.contact.phone}
              onChange={(e) => setNewCustomer({ 
                ...newCustomer, 
                contact: { ...newCustomer.contact, phone: e.target.value }
              })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newCustomer.relationship}
              onChange={(e) => setNewCustomer({ ...newCustomer, relationship: e.target.value })}
              className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={handleAddCustomer}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {customers.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No customers yet. Add your first customer above.</p>
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="border border-neutral-200 rounded-lg dark:border-neutral-700">
              {/* Customer Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                onClick={() => toggleExpanded(customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-400 transition-transform ${
                        expandedCustomers.has(customer.id) ? 'rotate-180' : ''
                      }`} 
                    />
                    <div>
                      <h5 className="font-medium text-neutral-900 dark:text-white">{customer.name}</h5>
                      {customer.region && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{customer.region}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRelationshipColor(customer.relationship)}`}>
                      {customer.relationship}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(customer.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomer(customer.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCustomers.has(customer.id) && (
                <div className="px-4 pb-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="pt-4 space-y-4">
                    {/* Contact Information */}
                    {customer.contact && (customer.contact.name || customer.contact.email || customer.contact.phone) && (
                      <div>
                        <h6 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Contact</h6>
                        <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                          {customer.contact.name && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.contact.name}</span>
                            </div>
                          )}
                          {customer.contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <a href={`mailto:${customer.contact.email}`} className="text-emerald-600 hover:text-emerald-700 underline">
                                {customer.contact.email}
                              </a>
                            </div>
                          )}
                          {customer.contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${customer.contact.phone}`} className="text-emerald-600 hover:text-emerald-700 underline">
                                {customer.contact.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {customer.products && customer.products.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Products</h6>
                        <div className="flex flex-wrap gap-1">
                          {customer.products.map((product, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {customer.tags && customer.tags.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Tags</h6>
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <h6 className="text-sm font-medium text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Notes
                      </h6>
                      <div className="space-y-2">
                        {customer.notes && customer.notes.length > 0 ? (
                          customer.notes.map((note, idx) => (
                            <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                              <div className="flex items-start justify-between">
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">{note.content}</p>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => setEditingNote({ customerId: customer.id, noteId: note.id, content: note.content })}
                                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveNote(customer.id, note.id)}
                                    className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {note.createdAt && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                  {new Date(note.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">No notes yet</p>
                        )}
                        
                        {/* Add Note */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddNote(customer.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddNote(customer.id)}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
