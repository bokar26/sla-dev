export function popupAuth(url: string, onDone: (ok: boolean) => void) {
  const w = 600, h = 700;
  const y = window.top!.outerHeight / 2 + window.top!.screenY - (h / 2);
  const x = window.top!.outerWidth / 2 + window.top!.screenX - (w / 2);
  const popup = window.open(
    url + (url.includes("?") ? "&" : "?") + "popup=1",
    "alibaba_oauth", 
    `width=${w},height=${h},top=${y},left=${x}`
  );

  function handler(ev: MessageEvent) {
    if (!ev || !ev.data) return;
    if (ev.data.provider === "alibaba") {
      window.removeEventListener("message", handler);
      try { 
        popup?.close(); 
      } catch {}
      onDone(ev.data.status === "success");
    }
  }
  window.addEventListener("message", handler);
}
