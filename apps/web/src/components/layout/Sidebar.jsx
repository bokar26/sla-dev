import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import UserProfileCard from "../sidebar/UserProfileCard";

/** Minimal inline icons to avoid adding deps */
const Icon = {
  home: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M3 12l9-9 9 9M4 10v10a2 2 0 002 2h4m4 0h4a2 2 0 002-2V10" />
    </svg>
  ),
  search: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  truck: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>
    </svg>
  ),
  bookmark: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 3h12v18l-6-4-6 4V3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  users: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeWidth="2"/>
      <circle cx="9" cy="7" r="4" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87" strokeWidth="2"/><path d="M16 3.13a4 4 0 010 7.75" strokeWidth="2"/>
    </svg>
  ),
  receipt: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 3h16v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" strokeWidth="2"/>
      <path d="M8 7h8M8 11h8M8 15h6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  coins: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <ellipse cx="12" cy="5" rx="7" ry="3" strokeWidth="2"/>
      <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" strokeWidth="2"/>
    </svg>
  ),
  plug: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 7v4m6-4v4M7 11h10v3a5 5 0 01-5 5h-0a5 5 0 01-5-5v-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  cog: (cls="") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M10.3 4.3l.4-2.3h2.6l.4 2.3a7.9 7.9 0 012.2 1.3l2.1-1.2 1.8 1.8-1.2 2.1c.5.7.9 1.4 1.3 2.2l2.3.4v2.6l-2.3.4a7.9 7.9 0 01-1.3 2.2l1.2 2.1-1.8 1.8-2.1-1.2a7.9 7.9 0 01-2.2 1.3l-.4 2.3h-2.6l-.4-2.3a7.9 7.9 0 01-2.2-1.3l-2.1 1.2-1.8-1.8 1.2-2.1a7.9 7.9 0 01-1.3-2.2L2.3 13v-2.6l2.3-.4c.3-.8.7-1.5 1.3-2.2L4.7 5.7 6.5 4l2.1 1.2c.7-.5 1.4-.9 2.2-1.3z" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
    </svg>
  ),
};

const items = [
  { label: "Supply Center", to: "/app/supply-center", icon: Icon.home },
  { label: "SLA Search",    to: "/app/sla-search", icon: Icon.search },
  { label: "Fulfillment",   to: "/app/fulfillment", icon: Icon.truck },
  { label: "Saved",         to: "/app/saved", icon: Icon.bookmark },
];

const database = [
  { label: "Clients", to: "/app/clients", icon: Icon.users },
  { label: "Orders",  to: "/app/orders",  icon: Icon.receipt },
  { label: "Finances",to: "/app/finances",icon: Icon.coins },
];

const system = [
  { label: "Settings",     to: "/app/settings",     icon: Icon.cog },
];

function NavSection({ title, links }) {
  return (
    <div className="mt-4">
      {title ? <div className="px-3 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{title}</div> : null}
      <nav className="px-2 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")
            }
          >
            {l.icon("h-4 w-4")}
            <span className="truncate">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[260px] shrink-0 border-r bg-white dark:bg-slate-900 dark:border-slate-800 h-screen sticky top-0 transition-colors">
      <div className="flex flex-col w-full">
        {/* Brand */}
        <div className="h-14 flex items-center justify-between border-b dark:border-slate-800 px-4">
          <NavLink to="/" className="text-base font-semibold tracking-tight hover:text-emerald-700 dark:hover:text-emerald-400">
            SLA
          </NavLink>
          <ThemeToggle />
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto py-3">
          <NavSection title="" links={items} />
          <NavSection title="Database" links={database} />
          <NavSection title="System" links={system} />
        </div>

        {/* Profile box pinned to bottom */}
        <UserProfileCard />
      </div>
    </aside>
  );
}
