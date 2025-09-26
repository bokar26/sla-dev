import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileImage, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';

const ImageSearchPanel = ({ onSearch, isSearching, searchError, onShowInfo }) => {
  const [files, setFiles] = useState([]);
  const [hints, setHints] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic'];

  const validateFile = (file) => {
    const errors = [];
    
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Only PNG, JPG, WebP, and HEIC files are allowed`);
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File size must be less than 12MB`);
    }
    
    return errors;
  };

  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    const allErrors = [];
    const validFiles = [];

    // Check total file count
    if (files.length + fileArray.length > MAX_FILES) {
      allErrors.push(`Maximum ${MAX_FILES} files allowed`);
      setErrors(allErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        allErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });

    if (allErrors.length > 0) {
      setErrors(allErrors);
    } else {
      setErrors([]);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, [files.length]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setErrors([]);
  };

  const moveFile = (fromIndex, toIndex) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  };

  const handleSearch = () => {
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('hints', hints);
    formData.append('topK', '10');
    
    onSearch(formData);
  };

  const getFilePreview = (file) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Image Search (Beta)</h3>
        <p className="text-sm text-muted-foreground">
          Upload 1-5 images to find matching factories using AI analysis
        </p>
      </div>

      {/* Dropzone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' 
            : 'border-neutral-300 dark:border-neutral-600 hover:border-emerald-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-emerald-600" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag and drop images here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WebP, HEIC up to 12MB each (max 5 files)
            </p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-foreground">Uploaded Images ({files.length}/5)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                >
                  <div className="aspect-square relative">
                    <img
                      src={getFilePreview(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hints Input */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Additional Hints (Optional)
        </label>
        <textarea
          value={hints}
          onChange={(e) => setHints(e.target.value)}
          placeholder="Add any additional context about the product, materials, or requirements..."
          className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          These hints will be combined with the AI analysis of your images
        </p>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching || files.length === 0}
        className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Images...
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4" />
            Analyze & Find Factories
          </>
        )}
      </button>

      {/* Search Error */}
      {searchError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">
              {searchError}
            </p>
          </div>
        </motion.div>
      )}

      {/* Info Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onShowInfo}
          className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1 mx-auto"
        >
          <Info className="w-3 h-3" />
          How this works
        </button>
      </div>
    </div>
  );
};

export default ImageSearchPanel;
