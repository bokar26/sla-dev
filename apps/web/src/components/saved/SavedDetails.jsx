import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Clock, 
  Package, 
  Phone, 
  Mail, 
  Globe, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  Factory,
  Plus,
  Users,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  Tag,
  Table2,
  Columns3,
  MoreHorizontal,
  Trash2,
  Edit3,
  GripVertical,
  Calendar,
  DollarSign,
  CheckSquare
} from 'lucide-react';
import CustomersPanel from './CustomersPanel';
import VendorDataPanel from './VendorDataPanel';

export default function SavedDetails({ open, onOpenChange, entity }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState(entity?.customers || []);
  const [notes, setNotes] = useState(entity?.notes || []);
  const [vendor, setVendor] = useState(entity);

  if (!open || !entity) return null;

  // Customer management functions
  const addCustomer = (customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const updateCustomer = (customerId, updates) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updates } : c));
  };

  const removeCustomer = (customerId) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const addNote = (customerId, content) => {
    const note = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? { ...c, notes: [...(c.notes || []), note] }
        : c
    ));
  };

  const updateNote = (customerId, noteId, content) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? { 
            ...c, 
            notes: c.notes?.map(n => n.id === noteId ? { ...n, content } : n) || []
          }
        : c
    ));
  };

  const removeNote = (customerId, noteId) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? { ...c, notes: c.notes?.filter(n => n.id !== noteId) || [] }
        : c
    ));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleWhatsAppClick = (phoneNumber) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = (phoneNumber) => {
    if (!phoneNumber) return;
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmailClick = (email) => {
    if (!email) return;
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="ml-auto h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {entity.type === 'supplier' ? (
                <Building2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Factory className="w-5 h-5 text-emerald-600" />
              )}
              <span className="text-xs uppercase text-neutral-500 font-medium">
                {entity.type === 'supplier' ? 'Supplier' : 'Factory'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">{entity.name}</h2>
            {entity.location && (
              <div className="flex items-center gap-1 text-sm text-neutral-500">
                <MapPin className="w-4 h-4" />
                {entity.location}
              </div>
            )}
          </div>
          <button
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
            onClick={() => onOpenChange(false)}
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
          <button
            className={`px-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab('customers')}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
              {customers.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                  {customers.length}
                </span>
              )}
            </div>
          </button>
          <button
            className={`px-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab('data')}
          >
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Data
              {entity?.dataTables?.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                  {entity.dataTables.length}
                </span>
              )}
            </div>
          </button>
          <button
            className={`px-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab('notes')}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Basic Information */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {entity.rating && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-neutral-700">{entity.rating}</span>
                <span className="text-neutral-500">({entity.reviewCount} reviews)</span>
              </div>
            )}
            {entity.avgDeliveryTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-700">{entity.avgDeliveryTime}</span>
              </div>
            )}
            {entity.minOrderQuantity && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-700">Min: {entity.minOrderQuantity}</span>
              </div>
            )}
            {entity.region && (
              <div className="text-neutral-700">
                <span className="text-neutral-500">Region:</span> {entity.region}
              </div>
            )}
          </div>
        </section>

        {/* Specialties */}
        {entity.specialties && entity.specialties.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {entity.specialties.map((specialty, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-sm rounded-full">
                  {specialty}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {entity.certifications && entity.certifications.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {entity.certifications.map((cert, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm rounded-full">
                  {cert}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Contact Information */}
        {entity.contact && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Contact Information</h3>
            <div className="space-y-3">
              {entity.contact.name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-neutral-900">{entity.contact.name}</span>
                  {entity.contact.title && (
                    <span className="text-sm text-neutral-500">— {entity.contact.title}</span>
                  )}
                  {entity.contact.status && (
                    <div className="flex items-center gap-1 ml-auto">
                      {getStatusIcon(entity.contact.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entity.contact.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {entity.contact.status}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {entity.contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <a 
                    href={`mailto:${entity.contact.email}`} 
                    className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEmailClick(entity.contact.email);
                    }}
                  >
                    {entity.contact.email}
                  </a>
                </div>
              )}
              
              {entity.contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <a 
                    href={`tel:${entity.contact.phone}`} 
                    className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePhoneClick(entity.contact.phone);
                    }}
                  >
                    {entity.contact.phone}
                  </a>
                  {entity.contact.whatsapp && (
                    <button
                      onClick={() => handleWhatsAppClick(entity.contact.whatsapp)}
                      className="ml-2 p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              
              {entity.contact.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-400" />
                  <a 
                    href={entity.contact.website.startsWith('http') ? entity.contact.website : `https://${entity.contact.website}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                  >
                    {entity.contact.website}
                  </a>
                </div>
              )}
              
              {entity.contact.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-700">{entity.contact.address}</span>
                </div>
              )}
              
              {entity.contact.social && (entity.contact.social.linkedin || entity.contact.social.x || entity.contact.social.instagram || entity.contact.social.wechat) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">Social:</span>
                  <div className="flex gap-3">
                    {entity.contact.social.linkedin && (
                      <a href={entity.contact.social.linkedin} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-700 underline">
                        LinkedIn
                      </a>
                    )}
                    {entity.contact.social.x && (
                      <a href={entity.contact.social.x} target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-gray-700 underline">
                        X
                      </a>
                    )}
                    {entity.contact.social.instagram && (
                      <a href={entity.contact.social.instagram} target="_blank" rel="noreferrer" className="text-sm text-pink-600 hover:text-pink-700 underline">
                        Instagram
                      </a>
                    )}
                    {entity.contact.social.wechat && (
                      <span className="text-sm text-green-600">WeChat: {entity.contact.social.wechat}</span>
                    )}
                  </div>
                </div>
              )}
              
              {entity.contact.notes && (
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700">
                    <strong>Contact Notes:</strong> {entity.contact.notes}
                  </p>
                </div>
              )}
              
              {entity.contact.lastContact && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>Last contact: {entity.contact.lastContact}</span>
                </div>
              )}
            </div>
          </section>
        )}

            {/* Notes */}
            {entity.notes && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Notes</h3>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{entity.notes}</p>
                </div>
              </section>
            )}

            {/* Additional Information */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {entity.savedDate && (
                  <div className="text-neutral-700 dark:text-neutral-300">
                    <span className="text-neutral-500 dark:text-neutral-400">Saved:</span> {new Date(entity.savedDate).toLocaleDateString()}
                  </div>
                )}
                {entity.lastContact && (
                  <div className="text-neutral-700 dark:text-neutral-300">
                    <span className="text-neutral-500 dark:text-neutral-400">Last Contact:</span> {new Date(entity.lastContact).toLocaleDateString()}
                  </div>
                )}
                {entity.coordinates && (
                  <div className="text-neutral-700 dark:text-neutral-300 col-span-2">
                    <span className="text-neutral-500 dark:text-neutral-400">Coordinates:</span> {entity.coordinates.lat}, {entity.coordinates.lng}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'customers' && (
          <CustomersPanel
            customers={customers}
            addCustomer={addCustomer}
            updateCustomer={updateCustomer}
            removeCustomer={removeCustomer}
            addNote={addNote}
            updateNote={updateNote}
            removeNote={removeNote}
          />
        )}

        {activeTab === 'data' && (
          <VendorDataPanel 
            entity={vendor || entity} 
            onVendorChange={setVendor} 
          />
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">General Notes</h3>
              {entity.notes ? (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{entity.notes}</p>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">No general notes available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
