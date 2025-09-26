import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TestPage from "./pages/TestPage";

export default function SimpleAppAdmin() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/test" replace />} />
        <Route path="/admin/test" element={<TestPage />} />
      </Routes>
    </div>
  );
}
