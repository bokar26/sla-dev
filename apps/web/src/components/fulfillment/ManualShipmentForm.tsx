import React, { useState } from 'react';
import { z } from 'zod';
import { toKg, toCm, calculateVolumetricWeight, calculateCbm } from '../../utils/units';

// Zod schema for validation
const manualShipmentSchema = z.object({
  originAddress: z.string().min(2, "Origin address is required"),
  destinationAddress: z.string().min(2, "Destination address is required"),
  freightType: z.enum(["air", "sea", "truck"]),
  speed: z.enum(["economy", "standard", "express"]),
  weight: z.number().positive("Weight must be greater than 0"),
  weightUnit: z.enum(["kg", "lb"]),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimUnit: z.enum(["cm", "in"]).optional(),
  pieces: z.number().int().positive().optional(),
  packaging: z.enum(["carton", "pallet", "other"]).optional(),
}).refine((data) => {
  if (data.freightType === "air" || data.freightType === "sea") {
    return data.length && data.width && data.height && data.dimUnit;
  }
  return true;
}, {
  message: "Dimensions are required for air and sea shipments",
  path: ["length"]
});

type ManualShipmentFormData = z.infer<typeof manualShipmentSchema>;

interface ManualShipmentFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const ManualShipmentForm: React.FC<ManualShipmentFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<Partial<ManualShipmentFormData>>({
    freightType: "air",
    speed: "standard",
    weightUnit: "kg",
    dimUnit: "cm",
    pieces: 1,
    packaging: "carton"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ManualShipmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = manualShipmentSchema.parse(formData);
      
      // Convert units and calculate derived metrics
      const weightKg = toKg(validatedData.weight, validatedData.weightUnit);
      const dimensionsCm = validatedData.length ? {
        lengthCm: toCm(validatedData.length, validatedData.dimUnit!),
        widthCm: toCm(validatedData.width!, validatedData.dimUnit!),
        heightCm: toCm(validatedData.height!, validatedData.dimUnit!),
        pieces: validatedData.pieces ?? 1,
      } : undefined;

      const volWeightKg = dimensionsCm ? calculateVolumetricWeight(
        dimensionsCm.lengthCm,
        dimensionsCm.widthCm,
        dimensionsCm.heightCm,
        dimensionsCm.pieces
      ) : undefined;

      const cbm = validatedData.freightType === "sea" && dimensionsCm ? calculateCbm(
        dimensionsCm.lengthCm,
        dimensionsCm.widthCm,
        dimensionsCm.heightCm,
        dimensionsCm.pieces
      ) : undefined;

      // Build unified payload
      const payload = {
        mode: "manual",
        shipment: {
          origin: { type: "address", addressLine: validatedData.originAddress },
          destination: { type: "address", addressLine: validatedData.destinationAddress },
          freightType: validatedData.freightType,
          speed: validatedData.speed,

          // normalized metrics
          weightKg,
          dimensionsCm,

          // derived metrics
          volWeightKg,
          cbm,

          packaging: validatedData.packaging ?? "carton",
        }
      };

      onSubmit(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const isDimensionsRequired = formData.freightType === "air" || formData.freightType === "sea";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Origin Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Origin Address *
        </label>
        <textarea
          value={formData.originAddress || ""}
          onChange={(e) => handleInputChange("originAddress", e.target.value)}
          placeholder="Enter origin address (city, country)"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
          rows={2}
        />
        {errors.originAddress && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.originAddress}</p>
        )}
      </div>

      {/* Destination Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Destination Address *
        </label>
        <textarea
          value={formData.destinationAddress || ""}
          onChange={(e) => handleInputChange("destinationAddress", e.target.value)}
          placeholder="Enter destination address (city, country)"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
          rows={2}
        />
        {errors.destinationAddress && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.destinationAddress}</p>
        )}
      </div>

      {/* Freight Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Freight Type *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "air", label: "Air" },
            { value: "sea", label: "Sea" },
            { value: "truck", label: "Truck" }
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleInputChange("freightType", value)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                formData.freightType === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Speed *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "economy", label: "Economy" },
            { value: "standard", label: "Standard" },
            { value: "express", label: "Express" }
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleInputChange("speed", value)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                formData.speed === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Weight *
          </label>
          <input
            type="number"
            value={formData.weight || ""}
            onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
            placeholder="0"
            step="0.01"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          {errors.weight && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.weight}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Unit
          </label>
          <select
            value={formData.weightUnit || "kg"}
            onChange={(e) => handleInputChange("weightUnit", e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      {/* Dimensions */}
      {isDimensionsRequired && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Dimensions (L × W × H) *
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <input
                type="number"
                value={formData.length || ""}
                onChange={(e) => handleInputChange("length", parseFloat(e.target.value) || 0)}
                placeholder="Length"
                step="0.01"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.width || ""}
                onChange={(e) => handleInputChange("width", parseFloat(e.target.value) || 0)}
                placeholder="Width"
                step="0.01"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.height || ""}
                onChange={(e) => handleInputChange("height", parseFloat(e.target.value) || 0)}
                placeholder="Height"
                step="0.01"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <select
                value={formData.dimUnit || "cm"}
                onChange={(e) => handleInputChange("dimUnit", e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>
          {errors.length && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.length}</p>
          )}
        </div>
      )}

      {/* Optional: Pieces and Packaging */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Pieces
          </label>
          <input
            type="number"
            value={formData.pieces || 1}
            onChange={(e) => handleInputChange("pieces", parseInt(e.target.value) || 1)}
            min="1"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Packaging
          </label>
          <select
            value={formData.packaging || "carton"}
            onChange={(e) => handleInputChange("packaging", e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="carton">Carton</option>
            <option value="pallet">Pallet</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Finding Routes...
          </>
        ) : (
          "Find Routes"
        )}
      </button>
    </form>
  );
};

export default ManualShipmentForm;
