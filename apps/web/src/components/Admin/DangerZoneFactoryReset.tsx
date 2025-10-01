import React from "react";

export default function DangerZoneFactoryReset() {
  // For demo/production safety, this is a non-destructive placeholder.
  // You can wire real destructive actions later behind admin auth.
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
      <p className="mt-2 text-sm text-gray-600">
        Factory reset actions are disabled in this demo build. Contact an admin to
        perform maintenance tasks.
      </p>
      <div className="mt-3 text-xs text-gray-400">
        Component: <code>DangerZoneFactoryReset</code>
      </div>
    </div>
  );
}