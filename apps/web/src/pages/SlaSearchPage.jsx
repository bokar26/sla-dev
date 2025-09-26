import React, { useRef } from "react";
import SlaSearchBar from "../components/SlaSearchBar";
import SlaResultsList from "../components/SlaResultsList";
import { useSlaSearch } from "../hooks/useSlaSearch";
import { useGoalChange } from "../components/goals/goalsBus";

export default function SlaSearchPage() {
  const { loading, data, error, search } = useSlaSearch();
  const lastQueryRef = useRef(null);

  // Auto re-run search when goals change (if we have a last query)
  useGoalChange(() => {
    if (lastQueryRef.current) {
      search(lastQueryRef.current);
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-3">SLA Search</h1>
      <SlaSearchBar onSearch={(q)=>{lastQueryRef.current = q; search(q);}} />
      {loading && <div className="mt-3 text-sm opacity-70">Searching…</div>}
      {error && <div className="mt-3 text-sm text-red-600">Error: {error}</div>}
      <SlaResultsList data={data} />
    </div>
  );
}
