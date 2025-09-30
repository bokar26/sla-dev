import React from "react";
import { NavLink } from "react-router-dom";

const nav = [
  { to: "/supply-center", label: "Supply Center", icon: "🏠" },
  { to: "/sla-search", label: "SLA Search", icon: "🔎" },
  { to: "/fulfillment", label: "Fulfillment", icon: "🚚" },
  { to: "/saved", label: "Saved", icon: "💾" },
  { label: "DATABASE", divider: true },
  { to: "/clients", label: "Clients", icon: "👥" },
  { to: "/orders", label: "Orders", icon: "🧾" },
  { to: "/finances", label: "Finances", icon: "💰" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }) {
  return (
    <div className="h-screen w-full bg-slate-50">
      <div className="grid h-full grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-slate-200 bg-white">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="h-16 flex items-center px-4 text-sm font-semibold tracking-wide text-slate-700">
              SLA
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-4">
              <ul className="space-y-1 text-[14px]">
                {nav.map((item, idx) =>
                  item.divider ? (
                    <li
                      key={`div-${idx}`}
                      className="mt-5 mb-2 select-none px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {item.label}
                    </li>
                  ) : (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 rounded-xl px-3 py-2 transition",
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-700 hover:bg-slate-100",
                          ].join(" ")
                        }
                      >
                        <span className="text-[16px]">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 overflow-hidden">
          {/* Sticky page header spacer height */}
          <div className="h-16" />
          <div className="h-[calc(100vh-64px)] overflow-auto">
            <div className="mx-auto max-w-[1280px] px-6 py-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
