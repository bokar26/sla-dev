import React from "react";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: any }> {
  state = { error: undefined as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) { console.error("Admin ErrorBoundary", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Admin crashed</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}
