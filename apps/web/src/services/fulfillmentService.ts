import { post } from "../lib/http";

export interface PlanRouteRequest {
  mode: "saved" | "manual";
  shipment: {
    origin: { type: string; addressLine?: string; city?: string; country?: string; portCode?: string };
    destination: { type: string; addressLine?: string; city?: string; country?: string; portCode?: string };
    freightType: "air" | "sea" | "truck";
    speed: "economy" | "standard" | "express" | "fastest" | "balanced" | "cheapest";
    weightKg: number;
    dimensionsCm?: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
      pieces: number;
    };
    volWeightKg?: number;
    cbm?: number;
    packaging?: string;
  };
  quoteId?: string;
  vendorId?: string;
}

export interface RouteRecommendation {
  id: string;
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  eta: number;
  reliability: number;
  emissions: number;
  legs: Array<{
    from: string;
    to: string;
    mode: string;
    carrier: string;
    cost: number;
    eta: number;
  }>;
  explanation: string;
}

export interface PlanRouteResponse {
  routes: RouteRecommendation[];
  meta: {
    tookMs: number;
    totalRoutes: number;
    source: string;
  };
}

export async function planRoute(
  request: PlanRouteRequest,
  opts?: { signal?: AbortSignal }
): Promise<PlanRouteResponse> {
  return post("/api/fulfillment/plan-route", request, { signal: opts?.signal });
}
