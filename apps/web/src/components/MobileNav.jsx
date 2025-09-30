import { useState } from 'react';
import { 
  Home, 
  Search, 
  FileText, 
  CheckSquare, 
  Mail, 
  Truck,
  Link as LinkIcon,
  Settings,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

export default function MobileNav({ 
  hasStartedChat, 
  activeDashboardTab, 
  setActiveDashboardTab,
  setHasStartedChat,
  setMessages,
  setShowOverviewPage,
  setShowAboutPage 
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show navigation when in dashboard mode
  if (!hasStartedChat) {
    return null;
  }

  // Navigation links for when user is in the app
  const appNavLinks = [
    { label: "Dashboard", icon: <Home size={16} />, action: () => setActiveDashboardTab("Dashboard") },
    { label: "SLA Search", icon: <Search size={16} />, action: () => setActiveDashboardTab("SLA Search") },
    { label: "Production Portfolio", icon: <BarChart3 size={16} />, action: () => setActiveDashboardTab("Production Portfolio") },
    { label: "Tasks", icon: <CheckSquare size={16} />, action: () => setActiveDashboardTab("Tasks") },
    { label: "Emails", icon: <Mail size={16} />, action: () => setActiveDashboardTab("Emails") },
    { label: "Settings", icon: <Settings size={16} />, action: () => setActiveDashboardTab("Settings") },
  ];

  const navLinks = appNavLinks;

  const handleLinkClick = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4">
              <ul className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = activeDashboardTab === link.label;
                  
                  return (
                    <li key={link.label}>
                      <button
                        onClick={() => handleLinkClick(link.action)}
                        className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                          isActive
                            ? "bg-black text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span>{link.icon}</span>
                        {link.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
