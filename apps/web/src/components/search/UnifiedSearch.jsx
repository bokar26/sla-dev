/**
 * Unified Search Component - handles both text and image search
 */
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { unifiedSearch } from '../../lib/api';
import { DEV_FAKE_RESULTS } from '../../config';
import Alert from '../ui/Alert';

export default function UnifiedSearch({ onResults }) {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...picked].slice(0, 5)); // max 5
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const data = await unifiedSearch(query, files, { topK: 10 });
      setResults(data?.results ?? []);
      onResults?.(data?.results ?? []);
    } catch (e) {
      console.error('Search error:', e);
      
      // Use dev fallback if available
      if (DEV_FAKE_RESULTS) {
        console.log('Using dev fallback results');
        const mockResults = [{
          id: 'demo1',
          name: 'Demo Factory',
          region: 'Tiruppur',
          country: 'India',
          score: 0.82,
          specialties: 'Cotton garments, hoodies',
          source: 'internal',
          mode: files.length > 0 ? 'image+text' : 'text'
        }];
        setResults(mockResults);
        onResults?.(mockResults);
      } else {
        setError(e?.message ?? 'Search failed');
        setResults([]);
        onResults?.([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const canSearch = query.trim() || files.length > 0;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" title="Search Error">
          {error}
        </Alert>
      )}

      {/* Main search input */}
      <div className="grid md:grid-cols-[1fr_auto] gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you need (e.g., 400gsm loop-knit hoodie, Tiruppur)"
          className="w-full rounded-lg border border-gray-300 bg-white/70 dark:bg-black/30 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && canSearch && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !canSearch}
          className="rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Optional image upload */}
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3 bg-white/50 dark:bg-white/5">
        <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Upload size={16} />
          Optional: add reference photos (max 5)
        </label>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFilePick} 
          className="mt-2 text-sm text-gray-600 dark:text-gray-400" 
        />
        
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {files.map((file, i) => (
              <li key={i} className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded p-2">
                <span className="truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                <button 
                  onClick={() => removeFile(i)} 
                  className="text-xs underline text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        
        <p className="text-xs mt-2 opacity-70 text-gray-600 dark:text-gray-400">
          We strip EXIF; images auto-delete after 24h.
        </p>
      </div>

      {/* Search mode indicator */}
      {files.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {query.trim() ? 'Mode: Image + Text search' : 'Mode: Image-only search'}
        </div>
      )}
    </div>
  );
}
