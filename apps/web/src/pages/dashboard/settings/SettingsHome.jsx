import React from "react";

export default function SettingsHome() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          General Settings
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
          Account Settings
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Configure your account preferences, notifications, and security settings.
        </p>
        <div className="mt-4">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
          Application Preferences
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Customize your dashboard, notifications, and display preferences.
        </p>
        <div className="mt-4">
          <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Configure Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
