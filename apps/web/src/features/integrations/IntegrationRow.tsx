import React from "react";

export type IntegrationRowProps = {
  id: string;
  name: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  connected?: boolean;
  connecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  extraActions?: React.ReactNode;
  className?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function IntegrationRow({
  id,
  name,
  Icon,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  extraActions,
  className,
}: IntegrationRowProps) {
  return (
    <div
      data-integration={id}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 px-4 py-3",
        "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
        className
      )}
      role="group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon ? <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden /> : null}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate text-slate-900 dark:text-slate-100">{name}</span>
          {connected ? (
            <span className="inline-flex items-center h-5 px-2 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center h-5 px-2 text-xs rounded-full border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Not connected
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {extraActions}
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className={cn(
              "inline-flex items-center h-8 px-3 text-sm rounded-md",
              "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
              "dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
            )}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={!!connecting}
            className={cn(
              "inline-flex items-center h-8 px-3 text-sm rounded-md",
              "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {connecting ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}


