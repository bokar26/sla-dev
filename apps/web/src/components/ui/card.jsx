export function Card({ children }) {
  return <div className="bg-white dark:bg-slate-900/60 shadow-md rounded-lg border border-slate-200 dark:border-slate-800">{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
