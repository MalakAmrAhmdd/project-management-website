"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Always-visible inline edit input. Shows value in a styled input field
 * that is always editable (no double-click needed).
 * Commits on blur or Enter; reverts on Escape.
 */
export function InlineInput({
  value,
  onSave,
  type = "text",
  className = "",
  placeholder = "",
  readOnly = false,
  align = "left",
}: {
  value: string;
  onSave: (val: string) => void;
  type?: "text" | "number" | "date";
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  align?: "left" | "right" | "center";
}) {
  const [draft, setDraft] = useState(value);
  const pristine = useRef(true);

  useEffect(() => {
    setDraft(value);
    pristine.current = true;
  }, [value]);

  const commit = () => {
    if (!pristine.current && draft !== value) {
      onSave(draft);
    }
    pristine.current = true;
  };

  if (readOnly) {
    return (
      <span className={cn(
        "block px-2 py-1 text-sm text-surface-500 bg-surface-50 rounded border border-surface-100",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}>
        {value || "—"}
      </span>
    );
  }

  return (
    <input
      type={type}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => { setDraft(e.target.value); pristine.current = false; }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { commit(); (e.target as HTMLInputElement).blur(); }
        if (e.key === "Escape") { setDraft(value); pristine.current = true; }
      }}
      className={cn(
        "w-full px-2 py-1 text-sm border border-surface-200 rounded bg-white",
        "focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400",
        "hover:border-primary-300 transition-colors",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    />
  );
}
