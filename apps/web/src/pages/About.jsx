import React from "react";

export default function About() {
  return (
    <article className="max-w-[820px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">About SLA</h1>
      <p className="text-slate-600 mt-4 leading-relaxed">
        SLA combines algorithmic search with logistics optimization to reduce cost and time across your supply chain.
        We analyze market signals, supplier performance, lead-time variability, and external conditions to recommend
        sourcing options and routes aligned with your goals.
      </p>
      <p className="text-slate-600 mt-4 leading-relaxed">
        Inside the dashboard you'll find SLA Search for factory discovery, Fulfillment for routing and carrier suggestions,
        order status monitoring, supplier management, invoicing, and financial tracking — all tied to data-driven targets.
      </p>
      <p className="text-slate-600 mt-4 leading-relaxed">
        The goal engine continuously evaluates options against your targets (e.g., reduce monthly spend or cut average
        transit time) and ranks results by expected impact.
      </p>
    </article>
  );
}
