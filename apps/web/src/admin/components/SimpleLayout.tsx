import React, { useState } from "react";
import { useLogout, useGetIdentity } from "@refinedev/core";
import { useNavigate, useLocation } from "react-router-dom";

export const SimpleLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { key: "/admin/overview", label: "Overview", icon: "📊" },
    { key: "/admin/users", label: "Users", icon: "👥" },
    { key: "/admin/demo-requests", label: "Demo Requests", icon: "📋" },
    { key: "/admin/quotes", label: "Quotes", icon: "💰" },
    { key: "/admin/factories", label: "Factories", icon: "🏭" },
    { key: "/admin/jobs", label: "Jobs", icon: "⚙️" },
    { key: "/admin/feature-flags", label: "Feature Flags", icon: "🚩" },
    { key: "/admin/audit-logs", label: "Audit Logs", icon: "📝" },
    { key: "/admin/webhooks", label: "Webhooks", icon: "🔗" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 to-purple-700 text-white transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 border-b border-white/20">
          <h1 className={`font-bold text-xl ${collapsed ? 'hidden' : 'block'}`}>
            SLA Admin
          </h1>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                location.pathname === item.key ? 'bg-white/20' : ''
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => item.key === location.pathname)?.label || 'Admin Dashboard'}
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {identity?.name || identity?.email}
                </div>
                <div className="text-xs text-gray-500">
                  {identity?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
