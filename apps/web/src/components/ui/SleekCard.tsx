import React from "react";

type Props = {
  className?: string;
  children: React.ReactNode;
  role?: string;
};

export default function SleekCard({ className = "", children, role }: Props) {
  return (
    <div
      role={role}
      className={[
        "rounded-2xl border shadow-sm",
        // adaptive background + border (no hard-coded white elsewhere)
        "border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900/60",
        className
      ].join(" ")}
    >
      {children}
    </div>
  );
}
