// JS-only. Uses IntegrationCard and keeps click-only OAuth.
import React, { useEffect, useMemo, useState } from "react";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import { alibabaApi } from "@/lib/api";
import { Package } from "lucide-react";

export default function AlibabaCard() {
  const [status, setStatus] = useState({ connected: false, account_name: null });

  useEffect(() => {
    let alive = true;
    alibabaApi.status().then(s => { if (alive) setStatus(s || { connected:false }); }).catch(()=>{});
    return () => { alive = false; };
  }, []);

  const subtitle = useMemo(() => {
    if (status.connected && status.account_name) return `Connected as ${status.account_name}`;
    if (status.connected) return "Connected to Alibaba";
    return "Not connected to Alibaba";
  }, [status]);

  async function onConnectClick() {
    const popup = window.open("about:blank", "alibaba_oauth", "width=980,height=720");
    const state = Math.random().toString(36).slice(2);
    try {
      const { url } = await alibabaApi.oauthUrl(state);
      if (url) { popup ? popup.location.replace(url) : window.location.assign(url); return; }
      throw new Error("Empty OAuth URL");
    } catch {
      try {
        const cfg = await alibabaApi.providerConfig();
        const base = (cfg?.authorize_base || "").replace(/\/+$/,"");
        const client = cfg?.client_id_public || "";
        const redirect = cfg?.redirect_uri || "";
        const scope = cfg?.scope || "read";
        if (base && client && redirect) {
          const qs = new URLSearchParams({ client_id: client, redirect_uri: redirect, response_type: "code", scope, state }).toString();
          const url = `${base}?${qs}`;
          popup ? popup.location.replace(url) : window.location.assign(url);
          return;
        }
        if (popup) {
          popup.document.open();
          popup.document.write(`<!doctype html><pre>Alibaba OAuth not configured.\nauthorize_base=${base}\nclient_id_public=${client}\nredirect_uri=${redirect}\nscope=${scope}</pre>`);
          popup.document.close();
        }
      } catch (e2) {
        if (popup) {
          popup.document.open();
          popup.document.write(`<!doctype html><pre>Alibaba OAuth failed: ${String(e2?.message || e2)}</pre>`);
          popup.document.close();
        }
      }
    }
  }

  return (
    <IntegrationCard
      size="sm"
      icon={<Package size={20} />}
      title="Alibaba"
      status={status.connected ? "connected" : "disconnected"}
      description="Connect your Alibaba account to sync orders, track shipments, and manage supplier relationships."
      features={[
        "Sync orders from Alibaba",
        "Track shipment status",
        "Manage supplier contacts",
        "Monitor order fulfillment",
      ]}
      primaryLabel="Connect with OAuth"
      onPrimaryClick={onConnectClick}
      secondaryLabel="Setup BYOA / Import CSV"
      onSecondaryClick={() => {
        import("@/components/ui/use-toast").then(m =>
          m?.toast?.({ title: "BYOA / CSV", description: "Coming soon.", variant: "default" })
        ).catch(()=>{});
      }}
      footer={
        <div className="flex items-center gap-4">
          <a className="underline hover:no-underline" href="https://www.alibaba.com/" target="_blank" rel="noreferrer">Visit Alibaba</a>
          <a className="underline hover:no-underline" href="#" onClick={(e)=>e.preventDefault()}>Documentation</a>
        </div>
      }
      rightTop={null}
    />
  );
}

