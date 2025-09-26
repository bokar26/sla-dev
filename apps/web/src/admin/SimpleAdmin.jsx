import React from "react";

export default function SimpleAdmin() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#f0f8ff" }}>
      <h1 style={{ color: "#006400" }}>✅ Simple Admin Dashboard</h1>
      <p>This is a basic admin dashboard without any complex dependencies.</p>
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "white", border: "1px solid #ddd" }}>
        <h2>Supply Base Stats</h2>
        <p><strong>Unique Vendors:</strong> 2,600</p>
        <p><strong>Total Factories:</strong> 7,567</p>
      </div>
    </div>
  );
}
