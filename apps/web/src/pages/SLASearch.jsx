import React, { useState } from "react";
import FileDrop from "../components/FileDrop";
import { uploadFile, visionExtract, ingestSearchWithFile } from "../lib/api";

export default function SLASearch() {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("");
  const [materials, setMaterials] = useState([]);
  const [dropped, setDropped] = useState([]);
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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
      setQuery(data.query_text);
      if (!productType && data.extract?.product_type) {
        setProductType(data.extract.product_type);
      }
      if ((data.extract?.materials || []).length) {
        setMaterials(prev => Array.from(new Set([...prev, ...data.extract.materials])));
      }

      // Update status and store results
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

      // Store search results
      setSearchResults(data.search.items);

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
    <div style={{
      maxWidth: 1200,
      margin: "2rem auto",
      padding: "0 1rem"
    }}>
      <h1 style={{
        fontSize: 32,
        fontWeight: 600,
        margin: 0,
        marginBottom: 16,
        color: "#1f2937"
      }}>
        SLA Search
      </h1>
      
      <p style={{
        color: "#6b7280",
        marginBottom: 24,
        fontSize: 16
      }}>
        Search and analyze Service Level Agreement requirements and capabilities.
      </p>

      <div style={{
        padding: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        marginBottom: 24
      }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          margin: 0,
          marginBottom: 16,
          color: "#374151"
        }}>
          Search SLA Requirements
        </h2>
        
        {/* SEARCH QUERY group with inline DropZone */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block",
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
            color: "#374151"
          }}>
            SEARCH QUERY
          </label>

          {/* NEW inline drop zone ABOVE the text input */}
          <div style={{ marginBottom: 8 }}>
            <FileDrop onFiles={handleFiles} />
          </div>

          {/* optional helper text */}
          <p style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 8,
            margin: 0
          }}>
            Drop an image or spec PDF above, or type a query below.
          </p>

          {/* existing text input remains BELOW */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SLA search terms..."
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              outline: "none"
            }}
          />

          {/* compact upload status line */}
          {dropped.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              {dropped.slice(0,1).map((d) => (
                <span key={d.name}>
                  {d.name}:{" "}
                  <span style={{
                    color: d.status === "done" ? "#10b981" :
                           d.status === "error" ? "#ef4444" : "#6b7280"
                  }}>
                    {d.status}{d.err ? ` — ${d.err}` : ""}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location input */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>


        {/* Materials chips */}
        {materials.length > 0 && (
          <div style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8
          }}>
            {materials.map((m) => (
              <span key={m} style={{
                fontSize: 12,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "4px 8px",
                backgroundColor: "#f9fafb"
              }}>{m}</span>
            ))}
          </div>
        )}

        {/* Product Type display */}
        {productType && (
          <div style={{
            marginBottom: 16,
            fontSize: 14,
            color: "#6b7280"
          }}>
            <span style={{ fontWeight: 500 }}>Product Type:</span> {productType}
          </div>
        )}

        {/* Note */}
        <div style={{
          marginBottom: 16,
          fontSize: 12,
          color: "#9ca3af"
        }}>
          Dropped files are used to auto-fill your search using vision extraction.
        </div>
        
        <button style={{
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer"
        }}>
          Search
        </button>
      </div>

      {/* AI-Powered Search Results */}
      {searchResults.length > 0 && (
        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#ffffff",
          marginBottom: 24
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            marginBottom: 16,
            color: "#374151"
          }}>
            AI-Powered Search Results
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {searchResults.map((result) => (
              <div key={result.id} style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                backgroundColor: "#f9fafb"
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 8,
                  color: "#374151"
                }}>
                  {result.name}
                </h3>
                <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                  <span>Country: {result.country}</span>
                  <span style={{ margin: "0 8px" }}>•</span>
                  <span>MOQ: {result.moq}</span>
                  <span style={{ margin: "0 8px" }}>•</span>
                  <span>Lead Time: {result.leadDays} days</span>
                  <span style={{ margin: "0 8px" }}>•</span>
                  <span>Price: ${result.priceUsd}/unit</span>
                </div>
                <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                  <span>Materials: {result.materials.join(", ")}</span>
                </div>
                <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                  <span>Certifications: {result.certs.join(", ")}</span>
                </div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  <span>Why: {result.why.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24
      }}>
        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Quality Standards
          </h3>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Define and search quality requirements and standards.
          </p>
        </div>

        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Delivery Terms
          </h3>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Search delivery timeline and logistics requirements.
          </p>
        </div>

        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Compliance
          </h3>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Monitor compliance with regulatory requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
