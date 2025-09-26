import { Link } from "react-router-dom";
import React from "react";

type Props = { children: React.ReactNode; title?: string; subtitle?: string };

export default function AdminLayout({ children, title="Overview", subtitle }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex">
        {/* Sidebar (admin-only) */}
        <aside className="hidden md:flex w-60 bg-white dark:bg-slate-900/60 border-r min-h-screen flex-col">
          <div className="px-4 py-4 border-b">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-slate-900" />
              <span className="font-semibold">SLA Admin</span>
            </Link>
          </div>
          <nav className="p-3 text-sm">
            <div className="mb-2 px-2 text-xs tracking-wide uppercase opacity-60">Dashboard</div>
            <Link to="/admin" className="block px-3 py-2 rounded-lg bg-slate-100 font-medium">
              Overview
            </Link>
            <div className="mb-2 px-2 text-xs tracking-wide uppercase opacity-60 mt-4">Analytics</div>
            <Link to="/admin/outputs" className="block px-3 py-2 rounded-lg hover:bg-slate-100 font-medium">
              Outputs/Reasoning
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-slate-900/60 border-b">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <Link to="/" className="underline">Home</Link> <span className="mx-1">/</span> Admin <span className="mx-1">/</span> {title}
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {/* room for a "Settings" or "Profile" button later */}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="max-w-7xl mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
