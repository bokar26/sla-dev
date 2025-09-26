export type ClientAddress = {
  id: string;
  label?: string;           // e.g., "HQ", "Billing", "Shipping"
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
};

export type ClientOrderMini = {
  id: string;
  orderNumber: string;
  skuCount: number;
  status: 'draft' | 'quoted' | 'in_production' | 'fulfilled' | 'cancelled';
  totalCost?: number;       // numeric
  createdAt: string;        // ISO
  updatedAt?: string;       // ISO
  vendorIds?: string[];     // cross-refs to vendor IDs used
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryContact?: string;  // name
  tags?: string[];
  addresses: ClientAddress[];
  orders: ClientOrderMini[];    // lightweight order listing
  vendorsUsed?: string[];       // vendor IDs or names (resolve in UI)
  notes?: string;
  createdAt: string;        // ISO
  updatedAt?: string;       // ISO
};

export type ClientExportRequest = {
  clientIds: string[];
  columns: string[];
  format: 'csv' | 'xlsx';
};

export type ClientExportResponse = {
  filename: string;
  mimeType: string;
  data: string | ArrayBuffer;
};
