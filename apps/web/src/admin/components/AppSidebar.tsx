import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, Users, FileText, Factory, Settings2, Activity, Flag, ListChecks, Webhook } from "lucide-react";

const items = [
  { to: "/admin/overview", icon: <LayoutGrid className="w-5 h-5" />, label: "Overview" },
  { to: "/admin/users", icon: <Users className="w-5 h-5" />, label: "Users" },
  { to: "/admin/demo-requests", icon: <FileText className="w-5 h-5" />, label: "Demo Requests" },
  { to: "/admin/quotes", icon: <Activity className="w-5 h-5" />, label: "Quotes" },
  { to: "/admin/factories", icon: <Factory className="w-5 h-5" />, label: "Factories" },
  { to: "/admin/jobs", icon: <ListChecks className="w-5 h-5" />, label: "Jobs" },
  { to: "/admin/feature-flags", icon: <Flag className="w-5 h-5" />, label: "Feature Flags" },
  { to: "/admin/audit-logs", icon: <Settings2 className="w-5 h-5" />, label: "Audit Logs" },
  { to: "/admin/webhooks", icon: <Webhook className="w-5 h-5" />, label: "Webhooks" },
];

export default function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-white/20 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
      <nav className="w-full p-6 space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">SocFlow Management</p>
        </motion.div>
        
        {items.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <NavLink 
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {item.icon}
              </motion.div>
              <span>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </aside>
  );
}
