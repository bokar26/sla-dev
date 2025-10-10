import { useState } from "react";
import FileDrop from "./FileDrop";
import { uploadFile, visionExtract, ingestSearchWithFile } from "../lib/api";

export default function SlaSearchBar({ onSearch, onResults }) {
  const [q, setQ] = useState("");
  const [productType, setProductType] = useState("");
  const [materials, setMaterials] = useState([]);
  const [dropped, setDropped] = useState([]);
  const [location, setLocation] = useState("");

  const handleFiles = async (files) => {
    // Use the new one-shot ingest endpoint
    const f = files[0]; // take first for now
    const base = [{ name: f.name, status: "processing" }];
    setDropped((prev) => [...base, ...prev]);

    try {
      const data = await ingestSearchWithFile(f, { 
        include_freshness: true, 
        location: location || undefined,
        product_type_hint: productType || undefined
      });

      // Auto-fill form with extracted data
      setQ(data.query_text);
      if (!productType && data.extract?.product_type) {
        setProductType(data.extract.product_type);
      }
      if ((data.extract?.materials || []).length) {
        setMaterials(prev => Array.from(new Set([...prev, ...data.extract.materials])));
      }

      // Update status and pass results to parent
      setDropped((cur) => { 
        const i = cur.findIndex(d => d.name === f.name); 
        if (i > -1) { 
          cur[i].status = "done"; 
          cur[i].data = data.extract;
          cur[i].confidence = data.confidence;
          cur[i].engine_used = data.engine_used;
          cur[i].freshness_notes = data.freshness_notes;
        } 
        return [...cur]; 
      });

      // Pass search results to parent component
      if (onResults) {
        onResults(data.search.items);
      }

    } catch (e) {
      setDropped((cur) => { 
        const i = cur.findIndex(d => d.name === f.name); 
        if (i > -1) { 
          cur[i].status = "error"; 
          cur[i].err = String(e.message || e); 
        } 
        return [...cur]; 
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* SEARCH QUERY group with inline DropZone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">SEARCH QUERY</label>
        
        {/* NEW inline drop zone ABOVE the text input */}
        <div className="mb-2">
          <FileDrop onFiles={handleFiles} />
        </div>

        {/* optional helper text */}
        <p className="text-xs text-gray-500 mb-2">Drop an image or spec PDF above, or type a query below.</p>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. 400gsm cotton hoodies from IN to US, 1500 units"
            className="w-full border rounded-xl px-4 py-2"
          />
          <button
            onClick={() => onSearch(q)}
            className="px-4 py-2 rounded-xl border shadow-sm"
          >
            Search
          </button>
        </div>

        {/* compact upload status line */}
        {dropped.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {dropped.slice(0,1).map((d) => (
              <span key={d.name}>
                {d.name}:{" "}
                <span className={
                  d.status === "done" ? "text-green-500" :
                  d.status === "error" ? "text-red-500" : "text-gray-500"
                }>
                  {d.status}{d.err ? ` — ${d.err}` : ""}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location input */}
      <div>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className="w-full border rounded-xl px-4 py-2"
        />
      </div>

      {/* Materials chips */}
      {materials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {materials.map((m) => (
            <span key={m} className="text-xs border border-gray-300 rounded px-2 py-1">{m}</span>
          ))}
        </div>
      )}

      {/* Product Type display */}
      {productType && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Product Type:</span> {productType}
        </div>
      )}

      {/* Note */}
      <div className="text-xs text-gray-500">
        Dropped files are used to auto-fill your search using vision extraction.
      </div>
    </div>
  );
}
