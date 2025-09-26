import React from "react";
import { Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";

export default function IntegrationCard({
  icon = null,
  title,
  status = "disconnected",
  description,
  features = [],
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
  footer = null,
  rightTop = null,
  size = "md", // "md" | "sm"
}) {
  const pill = {
    connected: { text: "Connected", cls: "text-emerald-700 bg-emerald-50", Icon: CheckCircle2 },
    pending: { text: "Pending", cls: "text-amber-700 bg-amber-50", Icon: null },
    disconnected: { text: "Disconnected", cls: "text-slate-500 bg-slate-100", Icon: XCircle },
  }[status || "disconnected"];

  const S = size === "sm"
    ? {
        cardPad: "p-5",
        radius: "rounded-2xl",
        iconBox: "h-10 w-10 rounded-xl",
        iconWrap: "text-emerald-600",
        title: "text-lg font-semibold leading-6",
        desc: "text-[13px] text-slate-500",
        featureText: "text-[13px] text-slate-700",
        checkSize: 14,
        btnH: "h-10",
        gapY: "space-y-1.5",
        topGap: "gap-3",
      }
    : {
        cardPad: "p-6",
        radius: "rounded-3xl",
        iconBox: "h-14 w-14 rounded-2xl",
        iconWrap: "text-emerald-600",
        title: "text-xl font-semibold leading-6",
        desc: "text-sm text-slate-500",
        featureText: "text-[15px] text-slate-700",
        checkSize: 16,
        btnH: "h-11",
        gapY: "space-y-2",
        topGap: "gap-4",
      };

  const PillIcon = pill?.Icon;

  return (
    <div className={`${S.radius} border bg-white shadow-sm ${S.cardPad} relative overflow-hidden`}>
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className={`flex items-start justify-between ${S.topGap}`}>
        <div className="flex items-center gap-3">
          <div className={`grid place-items-center ${S.iconBox} bg-emerald-50 ${S.iconWrap}`}>
            {icon}
          </div>
          <div>
            <div className={S.title}>{title}</div>
            <div className={S.desc}>{description}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${pill.cls}`}>
          {PillIcon ? <PillIcon size={14} /> : null}
          {pill.text}
        </span>
      </div>

      {features?.length ? (
        <ul className={`mt-4 ${S.gapY}`}>
          {features.map((f, i) => (
            <li key={i} className={`flex items-start gap-2 ${S.featureText}`}>
              <CheckCircle2 size={S.checkSize} className="mt-[2px] text-emerald-600 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 grid gap-2.5">
        {primaryLabel ? (
          <button
            type="button"
            onClick={onPrimaryClick}
            className={`inline-flex ${S.btnH} items-center justify-center rounded-xl bg-emerald-600 px-4 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60`}
          >
            <LinkIcon size={16} className="mr-2" />
            {primaryLabel}
          </button>
        ) : null}

        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondaryClick}
            className={`inline-flex ${S.btnH} items-center justify-center rounded-xl border px-4 font-medium text-slate-700 hover:bg-slate-50 transition`}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>

      {footer ? <div className="mt-4 text-[13px] text-slate-500">{footer}</div> : null}
    </div>
  );
}


