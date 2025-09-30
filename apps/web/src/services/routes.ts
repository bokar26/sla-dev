// Routes service for SLA route recommendations
// TODO: wire to backend when available

export interface RouteRecommendationRequest {
  origin: {
    city: string;
    country: string;
    portCode?: string;
  };
  destination: {
    city: string;
    country: string;
    portCode?: string;
  };
  freightMode: 'air' | 'sea' | 'truck';
  speedPref: 'fastest' | 'balanced' | 'cheapest';
  metrics: {
    totalWeightKg: number;
    totalVolumeCbm: number;
    chargeableAirKg: number;
    seaWmTon: number;
  };
  quoteId?: string;
  vendorId?: string;
}

export interface RouteLeg {
  from: string;
  to: string;
  type: 'air' | 'sea' | 'truck';
}

export interface RouteRecommendation {
  id: string;
  mode: 'air' | 'sea' | 'truck';
  carrier: string;
  etaDays: number;
  costUsd: number;
  reliability: number;
  emissionsKgCo2e: number;
  incoterms: string;
  legs: RouteLeg[];
  score: number;
  notes?: string;
}

export interface RouteRecommendationsResponse {
  routes: RouteRecommendation[];
  explanations: {
    scoringWeights: {
      cost: number;
      eta: number;
      reliability: number;
      emissions: number;
    };
    whyTopPick: string;
  };
}

// Simulate API delay (reduced for better UX)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock route recommendations
function generateMockRoutes(request: RouteRecommendationRequest): RouteRecommendation[] {
  const { freightMode, speedPref, metrics } = request;
  
  // Generate 3 routes with varying characteristics based on preferences
  const routes: RouteRecommendation[] = [];
  
  if (freightMode === 'air' || freightMode === 'sea') {
    // Air route
    routes.push({
      id: 'air_001',
      mode: 'air',
      carrier: 'DHL Global Forwarding',
      etaDays: speedPref === 'fastest' ? 3 : speedPref === 'balanced' ? 4 : 5,
      costUsd: speedPref === 'cheapest' ? 1200 : speedPref === 'balanced' ? 1500 : 1800,
      reliability: 0.92,
      emissionsKgCo2e: 310.4,
      incoterms: 'EXW',
      legs: [
        { from: request.origin.city, to: 'LAX', type: 'air' },
        { from: 'LAX', to: request.destination.city, type: 'truck' }
      ],
      score: speedPref === 'fastest' ? 0.95 : speedPref === 'balanced' ? 0.87 : 0.75,
      notes: 'Weekend uplift available'
    });
  }
  
  if (freightMode === 'sea' || freightMode === 'truck') {
    // Sea route
    routes.push({
      id: 'sea_001',
      mode: 'sea',
      carrier: 'COSCO Shipping',
      etaDays: speedPref === 'fastest' ? 14 : speedPref === 'balanced' ? 18 : 22,
      costUsd: speedPref === 'cheapest' ? 450 : speedPref === 'balanced' ? 600 : 750,
      reliability: 0.88,
      emissionsKgCo2e: 45.2,
      incoterms: 'FOB',
      legs: [
        { from: request.origin.portCode || request.origin.city, to: request.destination.portCode || request.destination.city, type: 'sea' }
      ],
      score: speedPref === 'cheapest' ? 0.92 : speedPref === 'balanced' ? 0.85 : 0.70,
      notes: 'Container consolidation available'
    });
  }
  
  // Truck route (domestic or short-haul)
  if (freightMode === 'truck' || (request.origin.country === request.destination.country)) {
    routes.push({
      id: 'truck_001',
      mode: 'truck',
      carrier: 'FedEx Freight',
      etaDays: speedPref === 'fastest' ? 2 : speedPref === 'balanced' ? 3 : 5,
      costUsd: speedPref === 'cheapest' ? 200 : speedPref === 'balanced' ? 300 : 400,
      reliability: 0.95,
      emissionsKgCo2e: 12.8,
      incoterms: 'DAP',
      legs: [
        { from: request.origin.city, to: request.destination.city, type: 'truck' }
      ],
      score: speedPref === 'fastest' ? 0.90 : speedPref === 'balanced' ? 0.88 : 0.85,
      notes: 'Direct delivery available'
    });
  }
  
  // Sort by score (highest first)
  return routes.sort((a, b) => b.score - a.score);
}

export async function recommendRoutes(request: RouteRecommendationRequest): Promise<RouteRecommendationsResponse> {
  // TODO: Replace with real API call when backend is available
  // const response = await fetch('/api/sla/routes/recommend', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // });
  // return response.json();
  
  // Simulate API delay (reduced for better UX)
  await delay(300);
  
  const routes = generateMockRoutes(request);
  
  return {
    routes,
    explanations: {
      scoringWeights: {
        cost: 0.4,
        eta: 0.35,
        reliability: 0.2,
        emissions: 0.05
      },
      whyTopPick: routes.length > 0 
        ? `Best ${request.speedPref} option with ${routes[0].reliability * 100}% reliability`
        : 'No routes available for the specified criteria'
    }
  };
}
