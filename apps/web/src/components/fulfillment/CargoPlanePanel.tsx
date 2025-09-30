// src/components/fulfillment/CargoPlanePanel.tsx
import React from "react";

export default function CargoPlanePanel(): React.JSX.Element {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-medium text-foreground">Shipping Planner</h2>
      </div>

      <div className="p-3">
        <div className="h-[360px] w-full flex items-center justify-center">
          {/* Simple, clean cargo-plane silhouette with subtle bob/bank */}
          <svg
            viewBox="0 0 320 180"
            width="260"
            height="146"
            className="ship-bob drop-shadow-xl"
            aria-hidden="true"
          >
            {/* Wing */}
            <rect x="40" y="78" width="240" height="12" rx="6" fill="#2563eb" className="ship-bank" />
            {/* Body */}
            <rect x="148" y="34" width="24" height="112" rx="12" fill="#2563eb" className="ship-bank" />
            {/* Nose cone */}
            <rect x="148" y="20" width="24" height="24" rx="12" fill="#1e40af" className="ship-bank" />
            {/* Tail fin */}
            <rect x="148" y="136" width="24" height="24" rx="6" fill="#1e40af" className="ship-bank" />
            {/* Soft shadow ellipse */}
            <ellipse cx="160" cy="160" rx="110" ry="18" fill="url(#g)" opacity="0.22" />
            <defs>
              <radialGradient id="g" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ready to plan shipping
        </p>
      </div>
    </div>
  );
}
