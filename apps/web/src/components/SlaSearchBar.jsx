import { useState } from "react";

export default function SlaSearchBar({ onSearch }) {
  const [q, setQ] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        placeholder="e.g. 400gsm cotton hoodies from IN to US, 1500 units"
        className="w-full border rounded-xl px-4 py-2"
      />
      <button
        onClick={()=>onSearch(q)}
        className="px-4 py-2 rounded-xl border shadow-sm"
      >
        Search
      </button>
    </div>
  );
}
