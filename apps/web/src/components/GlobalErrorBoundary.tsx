import React from "react";

type S = { hasError: boolean; error?: any };

export default class GlobalErrorBoundary extends React.Component<React.PropsWithChildren<{}>, S> {
  state: S = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(err: any, info: any) { console.error("[GlobalErrorBoundary]", err, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <h2>Something went wrong.</h2>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{String(this.state.error || "Unknown error")}</pre>
        <p style={{ opacity: 0.7 }}>See console for details. This is a temporary debug view.</p>
      </div>
    );
  }
}