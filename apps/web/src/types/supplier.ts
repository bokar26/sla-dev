export type SupplierSource =
  | "internal"
  | "web"
  | "alibaba"
  | "made-in-china"
  | string;

export interface SupplierListItem {
  id?: string;
  name?: string;
  country?: string;
  region?: string;
  url?: string | null;
  source?: SupplierSource;
  productTypes?: string[];
  score?: number;
  moq?: string | number;
  leadDays?: number;
  priceUsd?: number;
  materials?: string[];
  certs?: string[];
  reasoning?: string;
  reasons?: string[];
  contributions?: Record<string, number>;
  isBest?: boolean;
  belowThreshold?: boolean;
  sourceUrl?: string;
  marketplaceMeta?: any;
}

export interface SupplierProfile extends SupplierListItem {
  address?: string;
  email?: string;
  phone?: string;
  leadTime?: string;
  capabilities?: string[] | string;
  exportMarkets?: string[] | string;
  membership?: string;
  alibabaId?: string;
  notes?: string;
  _cache?: boolean;
}
