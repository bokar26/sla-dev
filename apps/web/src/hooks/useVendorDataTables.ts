import { useCallback, useState } from 'react';
import type { Vendor, DataTable, DataColumn, DataRow, DataCellValue, DataColumnType } from '@/types/vendor';

export function useVendorDataTables(initialVendor: Vendor | null) {
  const [vendor, setVendor] = useState<Vendor | null>(initialVendor);
  const tables = vendor?.dataTables ?? [];

  const save = useCallback(async (next: Vendor) => {
    setVendor(next); // optimistic
    // TODO: await fetch(`/api/vendors/${next.id}`, { method: 'PATCH', body: JSON.stringify({ dataTables: next.dataTables }) })
  }, []);

  const createTable = useCallback((name = 'New Table') => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const t: DataTable = {
      id: crypto.randomUUID(),
      name,
      columns: [
        { id: crypto.randomUUID(), key: 'name', name: 'Name', type: 'text', width: 240 },
      ],
      rows: [],
      createdAt: now,
      updatedAt: now,
    };
    void save({ ...vendor, dataTables: [t, ...tables] });
  }, [vendor, tables, save]);

  const renameTable = useCallback((id: string, name: string) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => t.id === id ? { ...t, name, updatedAt: now } : t);
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const deleteTable = useCallback((id: string) => {
    if (!vendor) return;
    void save({ ...vendor, dataTables: tables.filter(t => t.id !== id) });
  }, [vendor, tables, save]);

  const addColumn = useCallback((tableId: string, name: string, type: DataColumnType = 'text') => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => {
      if (t.id !== tableId) return t;
      const col: DataColumn = { id: crypto.randomUUID(), key: name.toLowerCase().replace(/\s+/g, '_'), name, type };
      return { ...t, columns: [...t.columns, col], updatedAt: now };
    });
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const updateColumn = useCallback((tableId: string, colId: string, patch: Partial<DataColumn>) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => t.id === tableId
      ? { ...t, columns: t.columns.map(c => c.id === colId ? { ...c, ...patch } : c), updatedAt: now }
      : t
    );
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const deleteColumn = useCallback((tableId: string, colId: string) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        columns: t.columns.filter(c => c.id !== colId),
        rows: t.rows.map(r => {
          const { [colId]: _drop, ...rest } = r.cells;
          return { ...r, cells: rest, updatedAt: now };
        }),
        updatedAt: now,
      };
    });
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const addRow = useCallback((tableId: string) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => {
      if (t.id !== tableId) return t;
      const emptyCells: Record<string, DataCellValue> = {};
      t.columns.forEach(c => { emptyCells[c.id] = null; });
      const row: DataRow = { id: crypto.randomUUID(), cells: emptyCells, createdAt: now, updatedAt: now };
      return { ...t, rows: [row, ...t.rows], updatedAt: now };
    });
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const updateCell = useCallback((tableId: string, rowId: string, colId: string, value: DataCellValue) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => t.id === tableId
      ? {
          ...t,
          rows: t.rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value }, updatedAt: now } : r),
          updatedAt: now,
        }
      : t
    );
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  const deleteRow = useCallback((tableId: string, rowId: string) => {
    if (!vendor) return;
    const now = new Date().toISOString();
    const next = tables.map(t => t.id === tableId
      ? { ...t, rows: t.rows.filter(r => r.id !== rowId), updatedAt: now }
      : t
    );
    void save({ ...vendor, dataTables: next });
  }, [vendor, tables, save]);

  return {
    vendor, setVendor,
    tables,
    createTable, renameTable, deleteTable,
    addColumn, updateColumn, deleteColumn,
    addRow, updateCell, deleteRow,
  };
}
