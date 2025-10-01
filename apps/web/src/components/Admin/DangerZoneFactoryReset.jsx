// apps/web/src/components/admin/DangerZoneFactoryReset.jsx
import React from "react";
import { Button } from "@/components/ui/button";

export default function DangerZoneFactoryReset({ onReset }) {
  return (
    <div className="rounded-xl border border-red-300/50 bg-red-50 p-4">
      <h3 className="text-red-700 font-semibold">Danger Zone</h3>
      <p className="text-red-600/80 text-sm mt-1">
        This will remove cached factory metrics and refresh admin data. This action cannot be undone.
      </p>
      <div className="mt-3">
        <Button
          variant="destructive"
          onClick={() => onReset?.()}
          aria-label="Reset factory analytics cache"
        >
          Reset Factory Analytics Cache
        </Button>
      </div>
    </div>
  );
}