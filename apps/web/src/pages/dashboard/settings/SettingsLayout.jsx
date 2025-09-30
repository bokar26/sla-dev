import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import ContentContainer from "../../../components/layout/ContentContainer";

const settingsItems = [
  { label: "General", to: "/app/settings" },
  { label: "Integrations", to: "/app/settings/integrations" },
];

export default function SettingsLayout() {
  return (
    <ContentContainer>
      <div className="flex gap-8">
        {/* Settings Navigation */}
        <div className="w-64 shrink-0">
          <div className="sticky top-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
              Settings
            </h1>
            <nav className="space-y-1">
              {settingsItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </ContentContainer>
  );
}
