import { Routes, Route } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import Overview from "./pages/Overview";
import OutputsReasoning from "../pages/admin/OutputsReasoning";
import "../styles/admin.css";

export default function AppAdmin() {
  return (
    <Routes>
      <Route path="/" element={
        <AdminLayout title="Overview" subtitle="Admin-only view with clean, minimal styling">
          <Overview />
        </AdminLayout>
      } />
      <Route path="/outputs" element={
        <AdminLayout title="Outputs/Reasoning" subtitle="Algorithm reasoning & telemetry">
          <OutputsReasoning />
        </AdminLayout>
      } />
    </Routes>
  );
}