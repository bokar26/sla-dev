import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

interface Column {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: any) => React.ReactNode;
  width?: number | string;
  sorter?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  searchable?: boolean;
  onSearch?: (value: string) => void;
  exportable?: boolean;
  onExport?: () => void;
  className?: string;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  pagination,
  searchable = false,
  onSearch,
  exportable = false,
  onExport,
  className = ""
}: DataTableProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default CSV export
      const headers = columns.map(col => col.title).join(",");
      const rows = data.map(record => 
        columns.map(col => {
          const value = col.dataIndex ? record[col.dataIndex] : "";
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",")
      );
      const csv = [headers, ...rows].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`bg-card backdrop-blur-md rounded-lg border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          {searchable && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus-visible:ring-2 ring-ring focus-visible:outline-none"
              />
            </div>
          )}
        </div>
        {exportable && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm focus-visible:ring-2 ring-ring"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted backdrop-blur-md border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-muted/60">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-foreground">
                      {column.render
                        ? column.render(column.dataIndex ? record[column.dataIndex] : record, record)
                        : column.dataIndex
                        ? record[column.dataIndex]
                        : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{" "}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 ring-ring"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-foreground">
              {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 ring-ring"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}