import React from "react";

export default function SupplyCenter() {
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
        Supply Center
      </h1>
      
      <p style={{
        color: "#6b7280",
        marginBottom: 24,
        fontSize: 16
      }}>
        Welcome to the Supply Center dashboard. Manage your suppliers, factories, and procurement operations.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
        marginTop: 32
      }}>
        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Suppliers
          </h2>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Manage your supplier network and relationships.
          </p>
        </div>

        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Factories
          </h2>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Monitor factory performance and capabilities.
          </p>
        </div>

        <div style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          backgroundColor: "#f9fafb"
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#374151"
          }}>
            Procurement
          </h2>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: 14
          }}>
            Track procurement activities and orders.
          </p>
        </div>
      </div>
    </div>
  );
}
