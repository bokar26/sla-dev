import React from "react";

/**
 * Admin "Danger Zone" panel.
 * Keep this component self-contained (no external imports) so CI builds never fail
 * due to missing design systems or env-specific code.
 */
export default function DangerZoneFactoryReset() {
  return (
    <div className="rounded-xl border border-red-200/70 bg-red-50 p-4">
      <h3 className="text-red-700 font-semibold">Danger zone</h3>
      <p className="mt-1 text-sm text-red-700/80">
        Resetting factory data is irreversible. Use only on non-production data.
      </p>
    </div>
  );
}
