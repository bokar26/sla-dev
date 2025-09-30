import React, { lazy, Suspense } from "react";

export function lazySafe(factory) {
  const Comp = lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      console.error("Lazy import failed:", err);
      if (import.meta.env.DEV) {
        console.error("Page loader error:", err);
      }
      return {
        default: () => (
          <div style={{ padding: "2rem" }}>
            <h2>Page failed to load</h2>
            <p>Check the file path or restore the missing file.</p>
            {import.meta.env.DEV && (
              <details style={{ marginTop: "1rem" }}>
                <summary>Error details (dev only)</summary>
                <pre style={{ fontSize: "12px", color: "#666" }}>
                  {err.toString()}
                </pre>
              </details>
            )}
          </div>
        ),
      };
    }
  });

  return (props) => (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading…</div>}>
      <Comp {...props} />
    </Suspense>
  );
}
