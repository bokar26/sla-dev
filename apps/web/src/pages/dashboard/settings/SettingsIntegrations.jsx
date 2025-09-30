import React, { useEffect, useState } from "react";
import IntegrationRow from "@/features/integrations/IntegrationRow";
import { Package as AlibabaIcon, CreditCard as StripeIcon, MessageCircle as WhatsAppIcon } from "lucide-react";
import { alibabaApi } from "@/lib/api";

export default function SettingsIntegrations() {
  const [alibaba, setAlibaba] = useState({ connected: false, connecting: false, account_name: null });

  useEffect(() => {
    let alive = true;
    alibabaApi
      .status()
      .then((s) => {
        if (alive) setAlibaba((prev) => ({ ...prev, connected: !!s?.connected, account_name: s?.account_name || null }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function connectAlibaba() {
    if (alibaba.connecting) return;
    setAlibaba((p) => ({ ...p, connecting: true }));
    const popup = window.open("about:blank", "alibaba_oauth", "width=980,height=720");
    const state = Math.random().toString(36).slice(2);
    try {
      const { url } = await alibabaApi.oauthUrl(state);
      if (url) {
        popup ? popup.location.replace(url) : window.location.assign(url);
        return;
      }
      throw new Error("Empty OAuth URL");
    } catch {
      try {
        const cfg = await alibabaApi.providerConfig();
        const base = (cfg?.authorize_base || "").replace(/\/+$/, "");
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
    } finally {
      setAlibaba((p) => ({ ...p, connecting: false }));
    }
  }

  // Placeholder actions for demo parity with old cards
  const showToast = async (title, description) => {
    try {
      const m = await import("@/components/ui/use-toast");
      m?.toast?.({ title, description, variant: "default" });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Integrations</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Connect and manage your integrations.</p>
      </div>

      {/* Alibaba */}
      <IntegrationRow
        id="alibaba"
        name="Alibaba"
        Icon={AlibabaIcon}
        connected={alibaba.connected}
        connecting={alibaba.connecting}
        onConnect={connectAlibaba}
        onDisconnect={() => showToast("Alibaba", "Disconnect coming soon.")}
        extraActions={
          <button
            type="button"
            onClick={() => showToast("Alibaba", "BYOA / CSV coming soon.")}
            className="inline-flex items-center h-8 px-3 text-sm rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            More
          </button>
        }
      />

      {/* Stripe */}
      <IntegrationRow
        id="stripe"
        name="Stripe"
        Icon={StripeIcon}
        connected={false}
        connecting={false}
        onConnect={() => showToast("Stripe integration", "Coming soon.")}
        onDisconnect={() => showToast("Stripe", "Disconnect coming soon.")}
      />

      {/* WhatsApp */}
      <IntegrationRow
        id="whatsapp"
        name="WhatsApp"
        Icon={WhatsAppIcon}
        connected={false}
        connecting={false}
        onConnect={() => showToast("WhatsApp integration", "Coming soon.")}
        onDisconnect={() => showToast("WhatsApp", "Disconnect coming soon.")}
      />
    </div>
  );
}
