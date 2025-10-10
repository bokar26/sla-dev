import React, { useCallback, useRef, useState } from "react";

type Props = {
  accept?: string[];
  maxSizeMb?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
};

export default function FileDrop({
  accept = ["image/png","image/jpeg","image/webp","application/pdf"],
  maxSizeMb = 15,
  multiple = true,
  onFiles,
  className = "",
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const validate = (files: File[]) => {
    const errors: string[] = [];
    const ok: File[] = [];
    for (const f of files) {
      if (f.size > maxSizeMb * 1024 * 1024) { errors.push(`${f.name}: over ${maxSizeMb}MB`); continue; }
      if (accept.length && !accept.includes(f.type)) {
        // allow some browsers that report type as empty for pdfs; fallback by name
        if (!(f.name.toLowerCase().endsWith(".pdf") && accept.includes("application/pdf"))) {
          errors.push(`${f.name}: unsupported type (${f.type||"unknown"})`); continue;
        }
      }
      ok.push(f);
    }
    if (errors.length) alert(errors.join("\n"));
    return ok;
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsOver(false);
    const files = Array.from(e.dataTransfer.files);
    const ok = validate(files);
    if (ok.length) onFiles(multiple ? ok : [ok[0]]);
  }, [multiple, onFiles]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const ok = validate(files);
    if (ok.length) onFiles(multiple ? ok : [ok[0]]);
    e.currentTarget.value = "";
  };

  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setIsOver(true);}}
      onDragLeave={()=>setIsOver(false)}
      onDrop={onDrop}
      className={[
        "border border-gray-300 rounded-md p-4 cursor-pointer transition",
        isOver ? "bg-gray-50" : "bg-white",
        className
      ].join(" ")}
      onClick={pick}
      role="button"
      aria-label="Upload images or PDFs by clicking or dragging files here"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept.join(",")}
        onChange={onChange}
      />
      <div className="text-sm text-gray-600">
        <div className="font-medium text-gray-900 mb-1">Drop images/PDF spec sheets</div>
        <div>PNG, JPG, WEBP, or PDF — up to {maxSizeMb}MB each. Click to browse or drag files here.</div>
      </div>
    </div>
  );
}
