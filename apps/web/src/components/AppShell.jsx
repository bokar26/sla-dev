/**
 * AppShell component with global API connectivity monitoring
 */
import React, { useEffect } from 'react';
import { pingAPI } from '../lib/net';
import { useApiStatus } from '../stores/apiStatus';
import Alert from './ui/Alert';

export default function AppShell({ children }) {
  const online = useApiStatus((s) => s.online);
  const setOnline = useApiStatus((s) => s.setOnline);

  useEffect(() => {
    let mounted = true;
    
    const check = async () => {
      const ok = await pingAPI();
      if (mounted) setOnline(ok);
    };
    
    // Initial check
    check();
    
    // Check every 15 seconds
    const id = setInterval(check, 15000);
    
    return () => { 
      mounted = false; 
      clearInterval(id); 
    };
  }, [setOnline]);

  return (
    <div className="h-screen w-screen flex flex-col">
      {!online && (
        <div className="p-3 shrink-0">
          <Alert variant="destructive" title="API Connection Issue">
            The API server isn't responding. Search may be limited. Check that it's running at your configured <code>VITE_API_BASE</code>.
          </Alert>
        </div>
      )}
      {/* Main content area is the only scroll container */}
      <div className="flex-1 min-h-0 flex">
        <main
          id="app-content"
          role="main"
          aria-label="Application content"
          className="flex-1 min-h-0 overflow-y-auto scroll-panel scroll-smooth"
          tabIndex={0}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
