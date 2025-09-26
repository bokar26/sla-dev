// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";

/**
 * Blocks ANY modal/popover/popup from auto-opening until a user gesture.
 * Also strips query params often used to trigger auto-open (e.g., ?connect=alibaba).
 */
export default function NoAutoOpenGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const origOpen = useRef<Window["open"] | null>(null);
  const mo = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // 0) Strip auto-trigger query params on first render
    try {
      const url = new URL(window.location.href);
      const suspicious = ["connect", "open", "modal", "provider", "integration"];
      let changed = false;
      for (const k of suspicious) if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; }
      if (changed) window.history.replaceState({}, "", url.toString());
    } catch {}

    // 1) Gate window.open
    origOpen.current = window.open;
    window.open = function (...args: any[]) {
      if (!allowed) {
        console.warn("[NoAutoOpenGuard] blocked window.open:", args[0]);
        return null;
      }
      // @ts-ignore
      return origOpen.current?.apply(window, args);
    } as any;

    // 2) Hide typical modal/popover portals until allowed
    const style = document.createElement("style");
    style.setAttribute("data-noauto-style", "true");
    style.textContent = `
      :root:not([data-allow-open="true"]) [role="dialog"][data-state="open"],
      :root:not([data-allow-open="true"]) [role="alertdialog"][data-state="open"],
      :root:not([data-allow-open="true"]) [data-radix-popper-content-wrapper][data-state="open"],
      :root:not([data-allow-open="true"]) .MuiModal-root.MuiModal-open,
      :root:not([data-allow-open="true"]) .ant-modal-wrap,
      :root:not([data-allow-open="true"]) .chakra-modal__content[data-state="open"],
      :root:not([data-allow-open="true"]) [data-headlessui-state~="open"] [role="dialog"],
      :root:not([data-allow-open="true"]) [data-portal="true"][data-state="open"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // 3) Watch DOM; force-close any modal that sneaks in before allowed
    mo.current = new MutationObserver((list) => {
      if (allowed) return;
      for (const m of list) {
        if (!(m.addedNodes && m.addedNodes.length)) continue;
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          const hit = n.matches?.('[role="dialog"],[role="alertdialog"],.MuiModal-root,.ant-modal-wrap,.chakra-modal__content,[data-radix-popper-content-wrapper],[data-portal="true"]')
            || !!n.querySelector?.('[role="dialog"],[role="alertdialog"],.MuiModal-root,.ant-modal-wrap,.chakra-modal__content,[data-radix-popper-content-wrapper],[data-portal="true"]');
          if (hit) {
            // Try to close politely by sending Escape
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            console.warn("[NoAutoOpenGuard] blocked auto-modal:", n.outerHTML?.slice(0, 200) || n.nodeName);
          }
        });
      }
    });
    mo.current.observe(document.body, { childList: true, subtree: true });

    // 4) Arm gesture unlock (first click / Enter / Space)
    const unlock = () => setAllowed(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") setAllowed(true); };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", onKey, { once: true, capture: true });

    return () => {
      if (origOpen.current) window.open = origOpen.current;
      style.remove();
      mo.current?.disconnect();
      window.removeEventListener("pointerdown", unlock, { capture: true } as any);
      window.removeEventListener("keydown", onKey, { capture: true } as any);
    };
  }, [allowed]);

  useEffect(() => {
    if (allowed) document.documentElement.setAttribute("data-allow-open", "true");
    else document.documentElement.removeAttribute("data-allow-open");
  }, [allowed]);

  return <>{children}</>;
}


