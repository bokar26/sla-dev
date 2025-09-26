import React from "react";

export default function SimpleTestPage() {
  console.log("SimpleTestPage is rendering!");
  
  return (
    <div style={{ padding: "20px", backgroundColor: "white", minHeight: "100vh" }}>
      <h1 style={{ color: "red", fontSize: "24px" }}>ADMIN DASHBOARD TEST</h1>
      <p style={{ color: "blue", fontSize: "16px" }}>If you can see this, the admin dashboard is working!</p>
      <div style={{ padding: "10px", backgroundColor: "green", color: "white", marginTop: "20px" }}>
        ✅ Admin dashboard is accessible and rendering correctly
      </div>
    </div>
  );
}
