import React from "react";

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
      <p>If you can see this, the admin routing is working.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p>✅ Admin dashboard is accessible</p>
        <p>✅ React is rendering</p>
        <p>✅ Routing is working</p>
      </div>
    </div>
  );
}