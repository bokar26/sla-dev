export function ProgressBlock({
  title,
  valueText,
  rightText,
  barPercent = 0.3,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">
          {title}
        </div>
        {rightText && (
          <div className="text-[12px] text-slate-500">
            {rightText}
          </div>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${Math.min(100, Math.max(0, barPercent * 100))}%` }}
        />
      </div>
      {valueText && (
        <div className="mt-2 text-[12px] text-slate-600">{valueText}</div>
      )}
    </div>
  );
}
