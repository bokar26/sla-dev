// Unit conversion helpers for shipment calculations

export const toKg = (weight: number, unit: "kg" | "lb"): number => {
  return unit === "kg" ? weight : weight * 0.45359237;
};

export const toCm = (length: number, unit: "cm" | "in"): number => {
  return unit === "cm" ? length : length * 2.54;
};

export const calculateVolumetricWeight = (
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  pieces: number = 1
): number => {
  // Air freight: (L × W × H in cm) / 5000
  return (lengthCm * widthCm * heightCm) / 5000 * pieces;
};

export const calculateCbm = (
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  pieces: number = 1
): number => {
  // Sea freight: convert to cubic meters
  return (lengthCm * widthCm * heightCm) / 1_000_000 * pieces;
};
