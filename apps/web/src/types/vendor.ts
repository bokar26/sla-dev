// Customer interface for vendors
export interface CustomerServed {
  id: string;
  name: string;
  region?: string;
  products?: string[];
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  tags?: string[];
  notes?: string;
  lastOrder?: string;
  totalOrders?: number;
  relationship?: 'active' | 'inactive' | 'prospect';
}

// Data table types
export type DataColumnType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'url' | 'currency' | 'tags';

export interface DataColumn {
  id: string;
  key: string;                // stable key for cells
  name: string;               // display name
  type: DataColumnType;
  options?: string[];         // for select/multiselect
  currency?: string;          // for currency cells (e.g., 'USD')
  width?: number;             // px
  required?: boolean;
}

export type DataCellValue =
  | string
  | number
  | boolean
  | string[]                 // multiselect/tags
  | { url: string; label?: string } // url
  | { amount: number; currency: string } // currency
  | null;

export interface DataRow {
  id: string;
  cells: Record<string, DataCellValue>; // columnId -> value
  createdAt: string;
  updatedAt: string;
}

export interface DataTable {
  id: string;
  name: string;
  columns: DataColumn[];
  rows: DataRow[];
  createdAt: string;
  updatedAt: string;
}

// Main vendor interface
export interface Vendor {
  id: string;
  type: 'factory' | 'supplier';
  name: string;
  region?: string;
  matchScore?: number;
  contact?: any;
  customers?: CustomerServed[]; // Available for both factories and suppliers
  dataTables?: DataTable[];     // Custom tables for data management
  meta?: any;
  // Additional fields that might be present
  location?: string;
  specialties?: string[];
  certifications?: string[];
  rating?: number;
  reviewCount?: number;
  avgDeliveryTime?: string;
  minOrderQuantity?: string;
  savedDate?: string;
  lastContact?: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
}
