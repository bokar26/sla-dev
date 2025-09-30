import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import Landing from "./pages/Landing.jsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.jsx";
import { lazySafe } from "./router/lazySafe.jsx";

// ✅ Update these paths to your actual files. If a file is missing,
// we'll get a friendly fallback instead of a 500/blank screen.
const SupplyCenter   = lazySafe(() => import("./pages/dashboard/SupplyCenterPage.jsx"));
// Temporarily use static import for SLA Search to debug
import SLASearchPage from "./pages/dashboard/SLASearchPage.jsx";
const Fulfillment    = lazySafe(() => import("./pages/dashboard/FulfillmentPage"));
const Clients        = lazySafe(() => import("./pages/dashboard/ClientsPage.jsx"));
const Orders         = lazySafe(() => import("./pages/dashboard/OrdersPage.jsx"));
const Finances       = lazySafe(() => import("./pages/dashboard/FinancesPage.jsx"));
const Saved          = lazySafe(() => import("./components/Saved.jsx"));
const AdminDashboard = lazySafe(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminDashboardPage = lazySafe(() => import("./pages/admin/AdminDashboardPage.tsx"));

// Settings with nested routes
const SettingsLayout = lazySafe(() => import("./pages/dashboard/settings/SettingsLayout.jsx"));
const SettingsHome = lazySafe(() => import("./pages/dashboard/settings/SettingsHome.jsx"));
const SettingsIntegrations = lazySafe(() => import("./pages/dashboard/settings/SettingsIntegrations.jsx"));

export default function App() {
  return (
    <AuthProvider>
      <Routes>
      {/* Home */}
      <Route path="/" element={<Landing />} />

      {/* Dashboard */}
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<Navigate to="supply-center" replace />} />
        <Route path="supply-center" element={<SupplyCenter />} />
        <Route path="sla-search" element={<SLASearchPage />} />
        <Route path="fulfillment" element={<Fulfillment />} />
        <Route path="clients" element={<Clients />} />
        <Route path="orders" element={<Orders />} />
        <Route path="finances" element={<Finances />} />
        <Route path="saved" element={<Saved />} />
        
        {/* Settings with nested routes */}
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<SettingsHome />} />
          <Route path="integrations" element={<SettingsIntegrations />} />
        </Route>
      </Route>

      {/* Dashboard alias for user login */}
      <Route path="/dashboard" element={<Navigate to="/app/supply-center" replace />} />

      {/* Redirect old integrations path to new settings path */}
      <Route path="/app/integrations" element={<Navigate to="/app/settings/integrations" replace />} />

      {/* Admin Dashboard */}
      <Route path="/admin" element={<AdminDashboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthProvider>
  );
}