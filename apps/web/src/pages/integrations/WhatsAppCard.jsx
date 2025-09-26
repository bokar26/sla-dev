import React from "react";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import { MessageCircle } from "lucide-react";

export default function WhatsAppCard() {
  const click = () =>
    import("@/components/ui/use-toast").then(m =>
      m?.toast?.({ title: "WhatsApp integration", description: "Coming soon.", variant: "default" })
    ).catch(()=>{});

  return (
    <IntegrationCard
      size="sm"
      icon={<MessageCircle size={20} />}
      title="WhatsApp"
      status="disconnected"
      description="Connect WhatsApp to communicate with suppliers and share order updates in real time."
      features={[
        "Send/receive supplier messages",
        "Share order & shipping updates",
        "Attach photos and documents",
        "Conversation history on orders",
      ]}
      primaryLabel="Connect"
      onPrimaryClick={click}
      secondaryLabel="Learn more"
      onSecondaryClick={click}
    />
  );
}


