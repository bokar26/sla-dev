import React from "react";

export default function SLASearch() {
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
        
        <div style={{
          marginBottom: 16
        }}>
          <input
            type="text"
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
