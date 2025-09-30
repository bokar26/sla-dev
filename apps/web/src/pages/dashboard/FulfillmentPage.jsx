import React, { useState } from "react";
import ContentContainer from "../../components/layout/ContentContainer";
import SleekProgressBar from "../../components/ui/SleekProgressBar";
import { useFulfillmentTimeSaved } from "../../hooks/useFulfillmentTimeSaved";
import NewRouteForm from "../../components/fulfillment/NewRouteForm";
import RouteResults from "../../components/fulfillment/RouteResults";
import { planRoute } from "../../services/fulfillmentService";
import { toast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";

export default function FulfillmentPage() {
  const { loading, data, error } = useFulfillmentTimeSaved();
  const [routeResults, setRouteResults] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  
  // Format duration helper
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handlePlanRoute = async (input) => {
    setRouteLoading(true);
    try {
      setLastRequest(input);
      const result = await planRoute(input);
      setRouteResults(result);
      if (!result?.routes?.length) {
        toast({ title: "No routes found", description: "Try adjusting details." });
      }
    } catch (e) {
      toast({ title: "Failed to plan routes", description: String(e?.message ?? e) });
      setRouteResults(null);
    } finally {
      setRouteLoading(false);
    }
  };

  const resetToForm = () => {
    setRouteResults(null);
    setLastRequest(null);
    setRouteLoading(false);
  };

  return (
    <ContentContainer>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-slate-900 dark:text-slate-100">Fulfillment</h1>
        <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
          Track shipments and plan routes. This shell wires navigation and scroll behavior.
        </p>
      </div>

      {/* Time Saved Progress Bar */}
      <div className="mb-6">
        {loading ? (
          <div className="w-full">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Time saved with SLA (Fulfillment)
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Loading time-saved metrics...
            </div>
          </div>
        ) : data ? (
          <SleekProgressBar
            label="Time saved with SLA (Fulfillment)"
            saved={data.time_saved_minutes}
            baseline={data.time_baseline_minutes}
            format={formatDuration}
            color="emerald"
            totalLabel="Total time spent"
          />
        ) : (
          <div className="w-full">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Time saved with SLA (Fulfillment)
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Connect to SLA metrics to enable time-saved tracking.
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: routes list */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Routes</h3>
          </div>
          <div className="space-y-2">
            {["Shanghai → LA", "Ho Chi Minh → NY", "Shenzhen → SF"].map((r) => (
              <div
                key={r}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{r}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">ETA 16–22 days</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: inline form OR route results */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-medium text-foreground">
              {routeResults ? "Route Options" : "Plan a New Route"}
            </h2>
            {routeResults && (
              <Button variant="outline" size="sm" onClick={resetToForm}>
                Start new route
              </Button>
            )}
          </div>

          <div className="p-4">
            {!routeResults ? (
              <NewRouteForm onSubmit={handlePlanRoute} isSubmitting={routeLoading} />
            ) : (
              <RouteResults 
                results={routeResults} 
                onClose={resetToForm} 
              />
            )}
          </div>
        </div>
      </div>

    </ContentContainer>
  );
}
