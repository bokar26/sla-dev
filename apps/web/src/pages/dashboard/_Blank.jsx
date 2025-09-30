import React from "react";

export default function Blank({ title = "Page" }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-[14px] text-slate-600">Content coming soon.</p>
      </div>
    </div>
  );
}
