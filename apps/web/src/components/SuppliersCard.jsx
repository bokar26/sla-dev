import React from "react";
import { useSuppliers } from "../hooks/portfolio/useSuppliers";
import { SuppliersTable } from "./portfolio/SuppliersTable";

export default function SuppliersCard() {
  const suppliersRes = useSuppliers({}) || {};
  const suppliers = suppliersRes.data || [];
  const suppliersLoading = !!suppliersRes.loading;

  const handleSupplierClick = (supplierId) => {
    console.log("Supplier clicked:", supplierId);
    // TODO: Implement supplier detail view
  };

  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Suppliers</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {suppliersLoading ? "Loading..." : `${suppliers.length} suppliers`}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <SuppliersTable 
          data={suppliers} 
          loading={suppliersLoading}
          onSupplierClick={handleSupplierClick}
        />
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <a href="#sla-suggestions-card" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">
          See SLA Suggestions →
        </a>
      </div>
    </div>
  );
}
