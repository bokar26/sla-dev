import React from "react";

export default function CardShell({ className = "", as: Comp = "div", ...props }) {
  const base =
    "rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors";
  return <Comp className={[base, className].join(" ")} {...props} />;
}
