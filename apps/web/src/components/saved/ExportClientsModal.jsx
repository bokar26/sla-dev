import React, { useMemo, useState } from 'react';
import { X, SlidersHorizontal, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ExportClientsModal({ onClose, clients }) {
  const sample = clients[0] || {};
  const [includeNestedSheets, setIncludeNestedSheets] = useState(true);

  // Default fields
  const defaultFields = [
    'id','name','email','phone','primaryContact','website',
    'addresses','orders','vendorsUsed','tags','notes','createdAt','updatedAt'
  ];

  // Build field list dynamically
  const coreFields = ['id','name','email','phone','primaryContact','website'];
  const addressFields = ['addresses'];
  const orderFields = ['orders'];
  const vendorFields = ['vendorsUsed'];
  const metaFields = ['tags','notes','createdAt','updatedAt'];

  const [selectedFields, setSelectedFields] = useState(new Set(defaultFields));

  const allFields = useMemo(() => {
    return [
      { group: 'Core', items: coreFields },
      { group: 'Addresses', items: addressFields },
      { group: 'Orders', items: orderFields },
      { group: 'Vendors', items: vendorFields },
      { group: 'Metadata', items: metaFields },
    ];
  }, []);

  const toggleField = (f) => setSelectedFields(prev => {
    const next = new Set(prev);
    next.has(f) ? next.delete(f) : next.add(f);
    return next;
  });

  const selectAll = () => setSelectedFields(new Set(allFields.flatMap(g => g.items)));
  const selectMinimal = () => setSelectedFields(new Set(['id','name','email','phone']));

  // Flatten helpers
  const get = (obj, path) => path.split('.').reduce((o,k)=> o?.[k], obj);
  const flattenClient = (c, fields) => {
    const row = {};
    fields.forEach(f => {
      let val;
      switch (f) {
        case 'addresses':
          val = c.addresses?.map(addr => 
            `${addr.label || 'Address'}: ${addr.line1}, ${addr.city}, ${addr.country}`
          ).join(' | ') || '';
          break;
        case 'orders':
          val = c.orders?.map(order => 
            `${order.orderNumber} (${order.status}, ${order.skuCount} SKUs)`
          ).join(' | ') || '';
          break;
        case 'vendorsUsed':
          val = c.vendorsUsed?.join(', ') || '';
          break;
        case 'tags':
          val = c.tags?.join(', ') || '';
          break;
        default:
          val = get(c, f);
      }
      if (Array.isArray(val)) val = val.join(', ');
      if (val && typeof val === 'object') val = JSON.stringify(val);
      row[f] = val ?? '';
    });
    return row;
  };

  // Build nested sheets
  const buildAddressesSheet = () => {
    const rows = [];
    clients.forEach(c => {
      (c.addresses ?? []).forEach(addr => {
        rows.push({
          client_id: c.id,
          client_name: c.name,
          address_id: addr.id,
          label: addr.label || '',
          line1: addr.line1 || '',
          line2: addr.line2 || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || '',
          phone: addr.phone || '',
        });
      });
    });
    return rows;
  };

  const buildOrdersSheet = () => {
    const rows = [];
    clients.forEach(c => {
      (c.orders ?? []).forEach(order => {
        rows.push({
          client_id: c.id,
          client_name: c.name,
          order_id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          skuCount: order.skuCount,
          totalCost: order.totalCost || 0,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt || '',
          vendorIds: (order.vendorIds || []).join(', '),
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
    const rows = clients.map(c => flattenClient(c, fields));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `clients_${Date.now()}.csv`);
  };

  const exportXLSX = () => {
    if (selectedFields.size === 0) {
      alert('Select at least one field.');
      return;
    }
    const fields = Array.from(selectedFields);
    const rows = clients.map(c => flattenClient(c, fields));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    if (includeNestedSheets) {
      const addrRows = buildAddressesSheet();
      if (addrRows.length) {
        const wsA = XLSX.utils.json_to_sheet(addrRows);
        XLSX.utils.book_append_sheet(wb, wsA, 'Addresses');
      }
      const orderRows = buildOrdersSheet();
      if (orderRows.length) {
        const wsO = XLSX.utils.json_to_sheet(orderRows);
        XLSX.utils.book_append_sheet(wb, wsO, 'Orders');
      }
    }
    XLSX.writeFile(wb, `clients_${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="mx-auto my-auto w-[720px] max-w-[95vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-neutral-500" />
            <div className="text-sm font-semibold">Export Clients</div>
          </div>
          <button className="text-neutral-400 hover:text-neutral-600" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-neutral-600">
            Selected clients: <strong>{clients.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-xs rounded border" onClick={selectAll}>Select All Fields</button>
            <button className="px-2 py-1 text-xs rounded border" onClick={selectMinimal}>Minimal</button>
            <label className="ml-auto flex items-center gap-2 text-xs">
              <input type="checkbox" checked={includeNestedSheets} onChange={(e)=>setIncludeNestedSheets(e.target.checked)} />
              Include nested sheets (Addresses / Orders) in XLSX
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
