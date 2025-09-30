import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Plus, Filter, Building2, MapPin, Phone, Mail, Upload } from 'lucide-react';
import SavedClientsPanel from '../../components/saved/SavedClientsPanel';
import UploadClientsModal from '../../features/clients/UploadClientsModal';

export default function ClientsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const handleOpenUploadModal = () => setUploadOpen(true);
    window.addEventListener('openUploadModal', handleOpenUploadModal);
    return () => window.removeEventListener('openUploadModal', handleOpenUploadModal);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clients</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage your client database and relationships</p>
              </div>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Clients</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">3</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Orders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">5</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Locations</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">3</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contact Points</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <SavedClientsPanel />
        
        {/* Upload Modal */}
        {uploadOpen && (
          <UploadClientsModal
            open={uploadOpen}
            onOpenChange={setUploadOpen}
          />
        )}
      </div>
    </div>
  );
}
