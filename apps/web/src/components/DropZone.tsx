// src/components/DropZone.tsx
import React, { useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  className?: string;
  variant?: "compact" | "default";
};

export default function DropZone({ onFiles, className = "", variant = "compact" }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = () => inputRef.current?.click();

  const handle = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(
      (f) =>
        ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(f.type) ||
        f.name.toLowerCase().endsWith(".pdf")
    );
    if (arr.length) onFiles(arr);
  };

  const base =
    variant === "compact"
      ? [
          // compact, single-row
          "flex items-center gap-2",
          "min-h-[44px] px-3 py-2 text-sm",
          // light green fill + dotted border
          "border border-dashed",
          "bg-emerald-50 dark:bg-emerald-900/20",
          "border-emerald-400/70 dark:border-emerald-500/50",
          // small radius, subtle hover
          "rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
        ].join(" ")
      : [
          "border border-[var(--border)] rounded-md",
          "bg-[var(--surface)] hover:bg-[var(--surface-2)]",
          "p-4 text-sm",
        ].join(" ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      className={[
        base,
        // focus/drag ring
        over ? "ring-2 ring-emerald-500/40" : "ring-0",
        "cursor-pointer transition",
        className,
      ].join(" ")}
      aria-label="Drop images/PDFs or click to upload"
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        multiple
        onChange={(e) => {
          handle(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {/* tiny icon + one-line copy */}
      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 opacity-80">
        <path
          d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="truncate">
        <span className="font-medium text-emerald-900 dark:text-emerald-100">Drop image/spec PDF</span>
        <span className="text-emerald-900/70 dark:text-emerald-200/80"> — or click to upload (≤15MB)</span>
      </span>
    </div>
  );
}
