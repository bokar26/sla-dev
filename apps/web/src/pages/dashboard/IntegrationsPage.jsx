import React from "react";

// Import the real integration cards from the existing integrations folder
import AlibabaCard from "../integrations/AlibabaCard";
import StripeCard from "../integrations/StripeCard";
import WhatsAppCard from "../integrations/WhatsAppCard";

export default function IntegrationsPage() {
  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-slate-500">Connect services to streamline billing, messaging, and supplier sync.</p>
      </header>

      {/* 3-up grid, responsive; cards sized to fit one row on xl */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* ALIBABA - Real API integration */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 md:p-6">
          <AlibabaCard />
        </div>

        {/* STRIPE - Coming soon */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 md:p-6">
          <StripeCard />
        </div>

        {/* WHATSAPP - Coming soon */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors p-4 md:p-6">
          <WhatsAppCard />
        </div>
      </div>
    </div>
  );
}
