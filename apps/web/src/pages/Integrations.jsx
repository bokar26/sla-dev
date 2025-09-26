// JS-only page. Renders all cards in a nice grid.
import React, { lazy, Suspense } from "react";

const AlibabaCard = lazy(() => import("@/pages/integrations/AlibabaCard"));
const StripeCard = lazy(() => import("@/pages/integrations/StripeCard"));
const WhatsAppCard = lazy(() => import("@/pages/integrations/WhatsAppCard"));

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="text-slate-600 mt-1">Connect your favorite tools and services to streamline your workflow</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Suspense fallback={<div className="rounded-2xl border p-6 bg-white shadow-sm">Loading…</div>}>
          <AlibabaCard />
          <StripeCard />
          <WhatsAppCard />
        </Suspense>
      </div>
    </div>
  );
}

