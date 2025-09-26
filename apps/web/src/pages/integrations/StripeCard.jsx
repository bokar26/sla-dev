import React from "react";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import { CreditCard } from "lucide-react";

export default function StripeCard() {
  const click = () =>
    import("@/components/ui/use-toast").then(m =>
      m?.toast?.({ title: "Stripe integration", description: "Coming soon.", variant: "default" })
    ).catch(()=>{});

  return (
    <IntegrationCard
      size="sm"
      icon={<CreditCard size={20} />}
      title="Stripe"
      status="disconnected"
      description="Connect Stripe to create and send professional invoices, process payments, and manage billing."
      features={[
        "Create and send invoices",
        "Process payments automatically",
        "Track payment status",
        "Generate financial reports",
      ]}
      primaryLabel="Connect"
      onPrimaryClick={click}
      secondaryLabel="Learn more"
      onSecondaryClick={click}
      footer={
        <div className="flex items-center gap-4">
          <a className="underline hover:no-underline" href="https://stripe.com" target="_blank" rel="noreferrer">Visit Stripe</a>
          <a className="underline hover:no-underline" href="#" onClick={(e)=>{e.preventDefault(); click();}}>Documentation</a>
        </div>
      }
    />
  );
}


