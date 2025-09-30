export function go(path: string, hardFallback = true) {
  try {
    // Prefer SPA navigation (if we're inside Router context)
    const nav = (window as any).__appNavigate as undefined | ((p: string) => void);
    if (nav) {
      nav(path);
      return;
    }
  } catch {}
  if (hardFallback) window.location.assign(path);
}
