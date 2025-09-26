import { 
  Home, 
  Search, 
  FileText, 
  CheckSquare, 
  Mail, 
  Truck,
  Link as LinkIcon,
  Settings,
  BarChart3
} from 'lucide-react';

export default function DesktopNav({ 
  hasStartedChat, 
  activeDashboardTab, 
  setActiveDashboardTab,
  setHasStartedChat,
  setMessages,
  setShowOverviewPage,
  setShowAboutPage 
}) {
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
    { label: "Integrations", icon: <LinkIcon size={16} />, action: () => setActiveDashboardTab("Integrations") },
    { label: "Settings", icon: <Settings size={16} />, action: () => setActiveDashboardTab("Settings") },
  ];

  const navLinks = appNavLinks;

  return (
    <nav className="hidden lg:block">
      <ul className="flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = activeDashboardTab === link.label;
          
          return (
            <li key={link.label}>
              <button
                onClick={link.action}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
