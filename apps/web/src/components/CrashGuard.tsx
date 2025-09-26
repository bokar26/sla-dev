import React from "react";

export function CrashGuard({ name = "Widget", children }: { name?: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary name={name}>
      {children}
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{ name: string; children: any }, { err?: any }> {
  state = { err: undefined as any };
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any, info: any) { console.error(`[${this.props.name}] crashed`, err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="rounded-lg border p-3 text-sm">
        <div className="font-semibold mb-1">{this.props.name} failed to render</div>
        <pre className="text-xs opacity-80 whitespace-pre-wrap">{String(this.state.err)}</pre>
      </div>
    );
  }
}
