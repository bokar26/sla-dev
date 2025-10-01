// apps/web/src/components/admin/DangerZoneFactoryReset.tsx
import React from "react";

export default function DangerZoneFactoryReset() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="text-red-700 font-semibold">Danger zone</h3>
      <p className="text-sm text-red-700/80">
        Resetting factory data is irreversible. Use only on non-production data.
      </p>
    </div>
  );
}