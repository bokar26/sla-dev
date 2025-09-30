// Shipment calculation utilities
// All units: kg, cm, cbm

export function cm3ToCbm(cm3: number): number {
  return cm3 / 1_000_000;
}

export function volumetricKgAir(l: number, w: number, h: number, qty: number): number {
  return (l * w * h) / 6000 * qty;
}

export function totalWeightKg(items: Array<{ qty: number; unit_weight_kg?: number }>): number {
  return items.reduce((sum, item) => sum + (item.qty * (item.unit_weight_kg || 0)), 0);
}

export function totalVolumeCbm(items: Array<{ 
  qty: number; 
  unit_dims_cm?: [number, number, number] 
}>): number {
  return items.reduce((sum, item) => {
    if (!item.unit_dims_cm || item.unit_dims_cm.length !== 3) return sum;
    const [l, w, h] = item.unit_dims_cm;
    const volumeCm3 = l * w * h * item.qty;
    return sum + cm3ToCbm(volumeCm3);
  }, 0);
}

export function calculateAirVolumetricKg(items: Array<{
  qty: number;
  unit_dims_cm?: [number, number, number];
}>): number {
  return items.reduce((sum, item) => {
    if (!item.unit_dims_cm || item.unit_dims_cm.length !== 3) return sum;
    const [l, w, h] = item.unit_dims_cm;
    return sum + volumetricKgAir(l, w, h, item.qty);
  }, 0);
}

export function calculateChargeableAirKg(totalWeightKg: number, airVolumetricKg: number): number {
  return Math.max(totalWeightKg, airVolumetricKg);
}

export function calculateSeaWmTon(totalWeightKg: number, totalVolumeCbm: number): number {
  return Math.max(totalWeightKg / 1000, totalVolumeCbm);
}

export function calculateTruckChargeableKg(totalWeightKg: number): number {
  // Fallback calculation - may need adjustment based on carrier factors
  return totalWeightKg;
}

export interface ShipmentMetrics {
  totalWeightKg: number;
  totalVolumeCbm: number;
  airVolumetricKg: number;
  chargeableAirKg: number;
  seaWmTon: number;
  truckChargeableKg: number;
}

export function calculateShipmentMetrics(items: Array<{
  qty: number;
  unit_weight_kg?: number;
  unit_dims_cm?: [number, number, number];
}>): ShipmentMetrics {
  const totalWeightKg = totalWeightKg(items);
  const totalVolumeCbm = totalVolumeCbm(items);
  const airVolumetricKg = calculateAirVolumetricKg(items);
  const chargeableAirKg = calculateChargeableAirKg(totalWeightKg, airVolumetricKg);
  const seaWmTon = calculateSeaWmTon(totalWeightKg, totalVolumeCbm);
  const truckChargeableKg = calculateTruckChargeableKg(totalWeightKg);

  return {
    totalWeightKg,
    totalVolumeCbm,
    airVolumetricKg,
    chargeableAirKg,
    seaWmTon,
    truckChargeableKg,
  };
}
