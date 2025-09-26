// src/types/fulfillment.ts
export type FulfillmentStatus =
  | 'draft'
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface ShipmentLeg {
  id: string;
  mode: 'air' | 'sea' | 'rail' | 'truck';
  carrier?: string;
  departAt?: string; // ISO
  arriveAt?: string; // ISO
  origin?: string;
  destination?: string;
  tracking?: string;
  cost?: number;
}

export interface FulfillmentOrder {
  id: string;
  poNumber?: string;
  sku?: string;
  quantity: number;
  unit?: string;               // e.g., 'pcs'
  factoryId?: string;
  status: FulfillmentStatus;
  legs?: ShipmentLeg[];
  incoterm?: 'FOB' | 'EXW' | 'CIF' | 'DDP' | 'DAP';
  createdAt?: string;          // ISO
  updatedAt?: string;          // ISO
  etd?: string;                // estimated depart
  eta?: string;                // estimated arrive
  notes?: string;
}
