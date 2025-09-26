type Props = {
  label: string;
  value?: string | number;
  sub?: string;
  loading?: boolean;
};

export default function AccentKpiCard({ label, value, sub, loading }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        // light mode greens
        "bg-emerald-50 border-emerald-200 text-emerald-950",
        // dark mode harmonies
        "dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200",
        "shadow-sm"
      ].join(" ")}
    >
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{loading ? "—" : (value ?? "—")}</div>
      {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
    </div>
  );
}
