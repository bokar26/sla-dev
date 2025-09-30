import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, FileImage, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

type UploadType = 'vendors' | 'quotes';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  type: UploadType;
  onSuccess: (result: any) => void;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

export default function UploadModal({ open, onClose, type, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptTypes = type === 'vendors' 
    ? { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }
    : { "application/pdf": [".pdf"], "image/png": [".png"] };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (type === 'vendors') {
        return ext === 'csv' || ext === 'xlsx';
      } else {
        return ext === 'pdf' || ext === 'png';
      }
    });

    const filesWithIds = validFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setFiles(prev => [...prev, ...filesWithIds]);
    setError(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const { uploadVendors, uploadQuotes } = await import('../../services/uploadsService');
      const result = type === 'vendors' 
        ? await uploadVendors(files)
        : await uploadQuotes(files);
      
      onSuccess(result);
      setFiles([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (type === 'vendors') {
      return <FileText className="w-5 h-5 text-blue-500" />;
    } else {
      return ext === 'pdf' 
        ? <FileText className="w-5 h-5 text-red-500" />
        : <FileImage className="w-5 h-5 text-green-500" />;
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Upload {type === 'vendors' ? 'Vendors' : 'Quotes'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {type === 'vendors' 
                  ? 'Upload CSV or Excel files with vendor information'
                  : 'Upload PDF or PNG files with quotes'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {type === 'vendors' 
                  ? 'Supports CSV and Excel (.xlsx) files'
                  : 'Supports PDF and PNG files'
                }
              </p>
              <input
                type="file"
                multiple
                accept={type === 'vendors' ? '.csv,.xlsx' : '.pdf,.png'}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                  Selected Files ({files.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        disabled={uploading}
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={files.length === 0 || uploading}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
