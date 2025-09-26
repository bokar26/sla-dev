import React, { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import DesktopNav from './components/DesktopNav';
import MobileNav from './components/MobileNav';
import Dashboard from './pages/Dashboard';
import About from './pages/About';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 3 },
  },
});

// Original Hero/Landing Page Component - Restored from original design
function HeroPage({ setHasStartedChat, setActiveDashboardTab }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-black">SLA</span>
            <span>Your single dashboard for global manufacturing partners</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">landing - development - {new Date().toLocaleTimeString()}</span>
            <span className="font-semibold text-black">sourcing simplified.</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="text-center max-w-2xl">
          {/* Logo */}
          <h1 className="text-6xl font-bold text-black mb-4">SLA</h1>
          <p className="text-2xl font-semibold text-black mb-6">supply made simple</p>
          
          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Unify sourcing, fulfillment, logistics, and financials in one AI-powered platform. 
            end-to-end supply chain management
          </p>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <button 
              onClick={() => {
                setHasStartedChat(true);
                setActiveDashboardTab('Dashboard');
              }}
              className="text-gray-700 hover:text-black transition-colors"
            >
              Overview
            </button>
            <button 
              onClick={() => {
                setHasStartedChat(true);
                setActiveDashboardTab('SLA Search');
              }}
              className="text-gray-700 hover:text-black transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => {
                setHasStartedChat(true);
                setActiveDashboardTab('About');
              }}
              className="text-gray-700 hover:text-black transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => {
                setHasStartedChat(true);
                setActiveDashboardTab('Dashboard');
              }}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Login
            </button>
          </div>
          
          {/* Book Demo Button */}
          <button 
            onClick={() => {
              setHasStartedChat(true);
              setActiveDashboardTab('Dashboard');
            }}
            className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg font-semibold mb-6"
          >
            Book Demo
          </button>
          
          {/* Hover to Discover */}
          <div className="text-gray-500 text-sm">
            <p>HOVER TO DISCOVER</p>
            <div className="flex justify-center mt-2">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>🌍</span>
            <span>🔍</span>
            <span>📦</span>
          </div>
          <div>
            <span>Copyright</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState('Dashboard');
  const [messages, setMessages] = useState([]);
  const [showOverviewPage, setShowOverviewPage] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 dark:bg-neutral-900">
        {hasStartedChat && (
          <>
            <Header 
              hasStartedChat={hasStartedChat}
              activeDashboardTab={activeDashboardTab}
              setActiveDashboardTab={setActiveDashboardTab}
              setHasStartedChat={setHasStartedChat}
              setMessages={setMessages}
              setShowOverviewPage={setShowOverviewPage}
              setShowAboutPage={setShowAboutPage}
            />
            
            <DesktopNav 
              hasStartedChat={hasStartedChat}
              activeDashboardTab={activeDashboardTab}
              setActiveDashboardTab={setActiveDashboardTab}
              setHasStartedChat={setHasStartedChat}
              setMessages={setMessages}
              setShowOverviewPage={setShowOverviewPage}
              setShowAboutPage={setShowAboutPage}
            />
            
            <MobileNav 
              hasStartedChat={hasStartedChat}
              activeDashboardTab={activeDashboardTab}
              setActiveDashboardTab={setActiveDashboardTab}
              setHasStartedChat={setHasStartedChat}
              setMessages={setMessages}
              setShowOverviewPage={setShowOverviewPage}
              setShowAboutPage={setShowAboutPage}
            />
          </>
        )}

        <main className="flex-1">
          {!hasStartedChat ? (
            <HeroPage 
              setHasStartedChat={setHasStartedChat}
              setActiveDashboardTab={setActiveDashboardTab}
            />
          ) : (
            <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
              <Dashboard 
                activeDashboardTab={activeDashboardTab}
                setActiveDashboardTab={setActiveDashboardTab}
              />
            </Suspense>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;