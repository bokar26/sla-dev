import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, Trash2, Eye } from 'lucide-react';

const ImageSearchInfoModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-foreground">
                How Reverse Image Search Works
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  AI-Powered Analysis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our reverse image search uses Mistral's advanced vision AI (Pixtral) to analyze your uploaded images 
                  and extract detailed product attributes. The AI identifies materials, construction methods, 
                  manufacturing processes, and other key characteristics that help match you with the right factories.
                </p>
              </div>

              {/* Process Steps */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  The Process
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Image Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        AI analyzes each image to identify product category, materials, construction details, 
                        and manufacturing requirements.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Factory Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        Extracted attributes are matched against our database of 10,000+ verified factories 
                        using advanced ranking algorithms.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Results Ranking</h4>
                      <p className="text-sm text-muted-foreground">
                        Factories are ranked by capability match, quality scores, and regional preferences 
                        to show the best matches first.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy & Security */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Privacy & Security
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Secure Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Images are processed securely on our servers with all metadata stripped for privacy.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Temporary Storage</h4>
                      <p className="text-sm text-muted-foreground">
                        Images are automatically deleted after 24 hours. No long-term storage of your files.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Eye className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">No Human Review</h4>
                      <p className="text-sm text-muted-foreground">
                        Only AI systems process your images. No human access to your uploaded content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Tips for Best Results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    Upload clear, well-lit images showing product details
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    Include multiple angles or close-ups of materials/construction
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    Add hints about specific requirements or quantities
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    Avoid images with prominent brand logos or copyrighted content
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={onClose}
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageSearchInfoModal;
