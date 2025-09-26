import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AppAdmin from './admin/AppAdmin';
import Integrations from './pages/Integrations';
import Dashboard from './pages/Dashboard';
const SettingsGoals = React.lazy(() => import('./pages/settings/SettingsGoals'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 3 },
  },
});

// Robust error boundary to avoid white screen
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
    // keep last error for quick inspect
    window.__APP_LAST_ERROR__ = { error, info };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong.</h2>
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            Check the console for details. You can continue by reloading or navigating.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, err: null })}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
          >
            Try to recover (reset boundary)
          </button>
          {process.env.NODE_ENV !== 'production' && this.state.err && (
            <pre style={{ marginTop: 16, background: '#fafafa', padding: 12, borderRadius: 8, overflow: 'auto' }}>
              {String(this.state.err?.stack || this.state.err)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Forces re-mount on route change to recover from stale HMR state
function RoutedApp() {
  const location = useLocation();
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading app…</div>}>
      <Routes location={location} key={location.pathname}>
        <Route path="/admin/*" element={<AppAdmin />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings/goals" element={<SettingsGoals />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <BrowserRouter>
          <RoutedApp />
        </BrowserRouter>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;