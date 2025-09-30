import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { clearClientCaches } from "@/lib/clearClientCaches";
import { apiUrl } from "@/lib/apiBase";

export default function DangerZoneFactoryReset() {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  async function doReset() {
    const r = await fetch(apiUrl("/api/admin/reset"), {
      method: "DELETE",
      credentials: "include",
      headers: { "X-Confirm": "CONFIRM-ORG-WIPE" }
    });
    const t = await r.text().catch(()=> "");
    if (!r.ok) throw new Error(t || r.statusText);
    return t ? JSON.parse(t) : {};
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Factory Reset</h3>
      <p className="text-sm text-red-700 dark:text-red-300 mt-2">
        Wipes all vendors, quotes, clients, orders, transactions, shipments, fulfillment routes, integrations, and cached metrics for this org. This cannot be undone.
      </p>

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-red-900 dark:text-red-100">
          Type <code className="bg-red-100 dark:bg-red-800 px-1 py-0.5 rounded text-xs">CONFIRM-ORG-WIPE</code> to continue
        </label>
        <Input 
          value={confirm} 
          onChange={e=>setConfirm(e.target.value)} 
          placeholder="CONFIRM-ORG-WIPE"
          className="border-red-300 focus:border-red-500 focus:ring-red-500"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="destructive"
          disabled={confirm !== "CONFIRM-ORG-WIPE" || pending}
          onClick={() => startTransition(async () => {
            try {
              const res = await doReset();
              const totalDeleted = Object.values(res?.deleted||{}).reduce((a:any,b:any)=>a+(b||0),0);
              toast({ 
                title: "Reset complete", 
                description: `Deleted ${totalDeleted} records. Reloading...` 
              });
              await clearClientCaches();
              setTimeout(() => window.location.reload(), 1000); // Give time for toast to show
            } catch (e:any) {
              toast({ 
                title: "Reset failed", 
                description: String(e?.message||e), 
                variant: "destructive" 
              });
            }
          })}
        >
          {pending ? "Resetting…" : "Factory reset"}
        </Button>
      </div>
    </div>
  );
}
