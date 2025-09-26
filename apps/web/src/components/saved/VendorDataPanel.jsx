import React, { useMemo, useState } from 'react';
import { Plus, Table2, MoreHorizontal, Trash2, Edit3, Columns3, GripVertical, Tag, Calendar, Link as LinkIcon, DollarSign, CheckSquare } from 'lucide-react';
import { useVendorDataTables } from '@/hooks/useVendorDataTables';

export default function VendorDataPanel({ entity, onVendorChange }) {
  const {
    vendor, setVendor, tables,
    createTable, renameTable, deleteTable,
    addColumn, updateColumn, deleteColumn,
    addRow, updateCell, deleteRow,
  } = useVendorDataTables(entity);

  // sync up to parent when local vendor changes
  React.useEffect(() => { if (vendor) onVendorChange?.(vendor); }, [vendor, onVendorChange]);

  const [activeId, setActiveId] = useState(tables[0]?.id);
  React.useEffect(() => {
    if (!activeId && tables[0]?.id) setActiveId(tables[0].id);
  }, [tables, activeId]);

  const active = useMemo(() => tables.find(t => t.id === activeId), [tables, activeId]);

  const columnTypeOptions = [
    { label: 'Text',         value: 'text',        icon: Edit3 },
    { label: 'Number',       value: 'number',      icon: Columns3 },
    { label: 'Select',       value: 'select',      icon: Tag },
    { label: 'Multiselect',  value: 'multiselect', icon: Tag },
    { label: 'Date',         value: 'date',        icon: Calendar },
    { label: 'Checkbox',     value: 'checkbox',    icon: CheckSquare },
    { label: 'URL',          value: 'url',         icon: LinkIcon },
    { label: 'Currency',     value: 'currency',    icon: DollarSign },
    { label: 'Tags',         value: 'tags',        icon: Tag },
  ];

  return (
    <section className="mt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Table2 className="size-4 text-neutral-500" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">Tables</span>
        </div>
        <button
          className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          onClick={() => createTable('New Table')}
        >
          <Plus className="size-3.5" /> New Table
        </button>
      </div>

      {/* Tabs for tables */}
      <div className="flex flex-wrap gap-2">
        {tables.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              activeId === t.id 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
            title={new Date(t.updatedAt).toLocaleString()}
          >
            {t.name}
          </button>
        ))}
        {tables.length === 0 && <div className="text-xs text-neutral-500 dark:text-neutral-400">No tables yet. Click "New Table".</div>}
      </div>

      {/* Active table toolbar */}
      {active && (
        <div className="flex items-center gap-2">
          <input
            className="border border-neutral-200 rounded-md px-2 py-1 text-sm w-64 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={active.name}
            onChange={(e) => renameTable(active.id, e.target.value)}
          />
          <button 
            className="text-xs text-red-600 hover:underline dark:text-red-400" 
            onClick={() => {
              if (confirm('Are you sure you want to delete this table?')) {
                deleteTable(active.id);
              }
            }}
          >
            <Trash2 className="size-3.5 inline-block mr-1" /> Delete
          </button>
          <div className="ml-auto flex items-center gap-2">
            <AddColumnMenu onAdd={(type, name) => addColumn(active.id, name, type)} options={columnTypeOptions} />
            <button 
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors" 
              onClick={() => addRow(active.id)}
            >
              <Plus className="size-3.5" /> Add Row
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {active && (
        <div className="overflow-auto rounded-2xl border border-neutral-200/60 dark:border-neutral-700">
          <table className="min-w-full text-sm bg-white dark:bg-neutral-900">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                {active.columns.map(col => (
                  <th key={col.id} className="px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-3.5 text-neutral-400" />
                      <input
                        className="bg-transparent border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-600 outline-none text-sm w-40 dark:text-white"
                        value={col.name}
                        onChange={(e) => updateColumn(active.id, col.id, { name: e.target.value })}
                      />
                      <ColumnTypeBadge type={col.type} />
                      <button 
                        className="ml-1 text-xs text-red-600 hover:underline dark:text-red-400" 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this column?')) {
                            deleteColumn(active.id, col.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {active.rows.map(row => (
                <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-700">
                  {active.columns.map(col => (
                    <td key={col.id} className="px-3 py-2 align-top">
                      <CellEditor
                        type={col.type}
                        value={row.cells[col.id] ?? null}
                        onChange={(val) => updateCell(active.id, row.id, col.id, val)}
                        column={col}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button 
                      className="text-xs text-red-600 hover:underline dark:text-red-400" 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this row?')) {
                          deleteRow(active.id, row.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {active.rows.length === 0 && (
                <tr>
                  <td colSpan={active.columns.length + 1} className="px-3 py-6 text-center text-neutral-500 dark:text-neutral-400">
                    No rows yet. Click "Add Row".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AddColumnMenu({ onAdd, options }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('New Column');
  
  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Columns3 className="size-3.5" /> Add Column
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-56 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
          <div className="p-2">
            <input 
              className="w-full border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Column name"
            />
          </div>
          <div className="max-h-48 overflow-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                onClick={() => { onAdd(opt.value, name || opt.label); setOpen(false); setName('New Column'); }}
              >
                <opt.icon className="size-3.5 text-neutral-500" /> {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnTypeBadge({ type }) {
  const map = {
    text: Edit3, number: Columns3, select: Tag, multiselect: Tag,
    date: Calendar, checkbox: CheckSquare, url: LinkIcon, currency: DollarSign, tags: Tag
  };
  const Icon = map[type] ?? Edit3;
  return <Icon className="size-3.5 text-neutral-400" title={type} />;
}

function CellEditor({ type, value, onChange, column }) {
  // Minimal editors; keep inline and simple
  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
      />
    );
  }
  if (type === 'number') {
    return (
      <input
        className="w-40 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        type="number"
        value={typeof value === 'number' ? value : (value ?? '')}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    );
  }
  if (type === 'date') {
    const v = typeof value === 'string' ? value.slice(0,10) : '';
    return (
      <input
        className="w-40 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        type="date"
        value={v}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }
  if (type === 'url') {
    const v = (value && typeof value === 'object') ? value.url : (typeof value === 'string' ? value : '');
    return (
      <input
        className="w-56 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        placeholder="https://"
        value={v}
        onChange={(e) => onChange({ url: e.target.value })}
      />
    );
  }
  if (type === 'currency') {
    const obj = (value && typeof value === 'object' && 'amount' in value) ? value : { amount: 0, currency: column?.currency || 'USD' };
    return (
      <div className="flex items-center gap-2">
        <input
          className="w-32 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          type="number"
          value={obj.amount}
          onChange={(e) => onChange({ ...obj, amount: Number(e.target.value || 0) })}
        />
        <input
          className="w-20 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          value={obj.currency}
          onChange={(e) => onChange({ ...obj, currency: e.target.value || 'USD' })}
        />
      </div>
    );
  }
  if (type === 'select') {
    const opts = column?.options ?? [];
    const v = (typeof value === 'string' ? value : '') || '';
    return (
      <select
        className="w-44 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        value={v}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === 'multiselect' || type === 'tags') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <input
        className="w-56 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        placeholder="Comma-separated"
        value={arr.join(', ')}
        onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      />
    );
  }
  // text (default)
  return (
    <input
      className="w-56 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      value={typeof value === 'string' ? value : (value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
