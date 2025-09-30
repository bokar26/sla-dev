import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import ThemeToggle from "../../components/ui/ThemeToggle";

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="flex h-[calc(100vh)]">
        <Sidebar />

        {/* Main scrollable area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
