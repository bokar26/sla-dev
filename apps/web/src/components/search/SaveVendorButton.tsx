import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { saveVendorApi } from "../../services/savedVendorsService";
import { useSavedVendors } from "../../stores/savedVendors";

interface SaveVendorButtonProps {
  factoryId?: string;
  snapshot?: {
    name?: string;
    region?: string;
    country?: string;
    vendor_type?: "factory" | "supplier";
  };
}

export default function SaveVendorButton({ factoryId, snapshot }: SaveVendorButtonProps) {
  const { addOrUpdate, setUpserting, upserting, has } = useSavedVendors();
  const isUpserting = !!(factoryId && upserting[factoryId]);
  const already = !!(factoryId && has(factoryId));
  const [done, setDone] = useState(false);

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!factoryId || isUpserting) return;

    // optimistic add (so it appears instantly in Vendors page)
    const optimistic: any = {
      vendorId: factoryId,
      name: snapshot?.name,
      region: snapshot?.region,
      country: snapshot?.country,
      vendor_type: snapshot?.vendor_type, // may be undefined; server will revalidate
      createdAt: new Date().toISOString(),
    };
    setUpserting(factoryId, true);
    addOrUpdate(optimistic);

    try {
      const res = await saveVendorApi(factoryId); // { vendorId, vendor_type, saved, alreadySaved? }
      addOrUpdate({
        vendorId: res.vendorId || factoryId,
        name: snapshot?.name,
        region: snapshot?.region,
        country: snapshot?.country,
        vendor_type: res.vendor_type,
        createdAt: new Date().toISOString(),
      });

      // success animation
      setDone(true);
      confetti({ particleCount: 24, spread: 60, scalar: 0.7, origin: { y: 0.8 } });
      setTimeout(() => setDone(false), 800);
    } catch (err) {
      // rollback optimistic if the server rejected it
      // (optional) could re-fetch store here; for now just toast
      console.error("Save vendor failed:", err);
    } finally {
      setUpserting(factoryId, false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={onSave}
      disabled={!factoryId || isUpserting}
      className="relative inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
      whileTap={{ scale: 0.98 }}
      aria-label="Save vendor"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {done ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="flex items-center gap-2 text-emerald-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Saved
          </motion.span>
        ) : isUpserting ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Saving…
          </motion.span>
        ) : already ? (
          <motion.span key="already" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Already saved
          </motion.span>
        ) : (
          <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Save vendor
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
