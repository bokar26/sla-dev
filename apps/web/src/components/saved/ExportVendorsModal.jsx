import React, { useMemo, useState } from 'react';
import { X, SlidersHorizontal, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ExportVendorsModal({ onClose, vendors }) {
  const sample = vendors[0] || {};
  const [includeNestedSheets, setIncludeNestedSheets] = useState(true);

  // Default fields
  const defaultFields = [
    'id','type','name','region','matchScore',
    'contact.name','contact.title','contact.email','contact.phone','contact.website',
    'customers.count','customers.names',
    'dataTables.count'
  ];

  // Build field list dynamically (union with defaults)
  const coreFields = ['id','type','name','region','matchScore'];
  const contactFields = ['contact.name','contact.title','contact.email','contact.phone','contact.website','contact.address'];
  const customerAgg = ['customers.count','customers.names'];
  const dataAgg = ['dataTables.count'];

  const [selectedFields, setSelectedFields] = useState(new Set(defaultFields));

  const allFields = useMemo(() => {
    // If you want to introspect more fields from sample.meta, add here
    return [
      { group: 'Core', items: coreFields },
      { group: 'Contact', items: contactFields },
      { group: 'Customers (aggregated)', items: customerAgg },
      { group: 'Data Tables (aggregated)', items: dataAgg },
    ];
  }, []);

  const toggleField = (f) => setSelectedFields(prev => {
    const next = new Set(prev);
    next.has(f) ? next.delete(f) : next.add(f);
    return next;
  });

  const selectAll = () => setSelectedFields(new Set(allFields.flatMap(g => g.items)));
  const selectMinimal = () => setSelectedFields(new Set(['id','type','name','region']));

  // Flatten helpers
  const get = (obj, path) => path.split('.').reduce((o,k)=> o?.[k], obj);
  const flattenVendor = (v, fields) => {
    const row = {};
    fields.forEach(f => {
      let val;
      switch (f) {
        case 'customers.count': val = v.customers?.length ?? 0; break;
        case 'customers.names': val = (v.customers ?? []).map(c => c.name).filter(Boolean).join(', '); break;
        case 'dataTables.count': val = v.dataTables?.length ?? 0; break;
        default: val = get(v, f);
      }
      if (Array.isArray(val)) val = val.join(', ');
      if (val && typeof val === 'object') val = JSON.stringify(val);
      row[f] = val ?? '';
    });
    return row;
  };

  // Build nested sheets
  const buildCustomersSheet = () => {
    const rows = [];
    vendors.forEach(v => {
      (v.customers ?? []).forEach(c => {
        rows.push({
          vendor_id: v.id,
          vendor_name: v.name,
          vendor_type: v.type,
          customer_id: c.id,
          customer_name: c.name,
          region: c.region ?? '',
          products: (c.products ?? []).join(', '),
          contact_name: c.contact?.name ?? '',
          contact_email: c.contact?.email ?? '',
          contact_phone: c.contact?.phone ?? '',
          tags: (c.tags ?? []).join(', '),
          lastOrderAt: c.lastOrderAt ?? '',
          valueYTD: c.valueYTD ?? '',
        });
      });
    });
    return rows;
  };

  const buildDataTablesSheet = () => {
    const rows = [];
    vendors.forEach(v => {
      (v.dataTables ?? []).forEach(t => {
        (t.rows ?? []).forEach(r => {
          const flatCells = {};
          Object.entries(r.cells || {}).forEach(([colId, cellVal]) => {
            flatCells[colId] = Array.isArray(cellVal)
              ? cellVal.join(', ')
              : (cellVal && typeof cellVal === 'object')
                ? JSON.stringify(cellVal)
                : cellVal ?? '';
          });
          rows.push({
            vendor_id: v.id,
            vendor_name: v.name,
            table_id: t.id,
            table_name: t.name,
            ...flatCells,
          });
        });
      });
    });
    return rows;
  };

  // Export actions
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const exportCSV = () => {
    if (selectedFields.size === 0) {
      alert('Select at least one field.');
      return;
    }
    const fields = Array.from(selectedFields);
    const rows = vendors.map(v => flattenVendor(v, fields));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `vendors_${Date.now()}.csv`);
  };

  const exportXLSX = () => {
    if (selectedFields.size === 0) {
      alert('Select at least one field.');
      return;
    }
    const fields = Array.from(selectedFields);
    const rows = vendors.map(v => flattenVendor(v, fields));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    if (includeNestedSheets) {
      const custRows = buildCustomersSheet();
      if (custRows.length) {
        const wsC = XLSX.utils.json_to_sheet(custRows);
        XLSX.utils.book_append_sheet(wb, wsC, 'Customers');
      }
      const dtRows = buildDataTablesSheet();
      if (dtRows.length) {
        const wsD = XLSX.utils.json_to_sheet(dtRows);
        XLSX.utils.book_append_sheet(wb, wsD, 'DataTables');
      }
    }
    XLSX.writeFile(wb, `vendors_${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="mx-auto my-auto w-[720px] max-w-[95vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-neutral-500" />
            <div className="text-sm font-semibold">Export Vendors</div>
          </div>
          <button className="text-neutral-400 hover:text-neutral-600" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-neutral-600">
            Selected vendors: <strong>{vendors.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-xs rounded border" onClick={selectAll}>Select All Fields</button>
            <button className="px-2 py-1 text-xs rounded border" onClick={selectMinimal}>Minimal</button>
            <label className="ml-auto flex items-center gap-2 text-xs">
              <input type="checkbox" checked={includeNestedSheets} onChange={(e)=>setIncludeNestedSheets(e.target.checked)} />
              Include nested sheets (Customers / DataTables) in XLSX
            </label>
          </div>

          {/* Field checklist */}
          <div className="grid grid-cols-2 gap-4">
            {allFields.map(group => (
              <div key={group.group} className="rounded-lg border p-3">
                <div className="text-xs font-semibold mb-2">{group.group}</div>
                <div className="space-y-1">
                  {group.items.map(f => (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(f)}
                        onChange={() => toggleField(f)}
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded border" onClick={onClose}>Cancel</button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded bg-neutral-900 text-white" onClick={exportCSV}>
            <Download className="size-4" /> Export CSV
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded bg-emerald-600 text-white" onClick={exportXLSX}>
            <Download className="size-4" /> Export XLSX
          </button>
        </div>
      </div>
    </div>
  );
}
