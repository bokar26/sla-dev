import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-emerald-900/20">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <AppHeader />
        <div className="flex-1 p-8 space-y-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
