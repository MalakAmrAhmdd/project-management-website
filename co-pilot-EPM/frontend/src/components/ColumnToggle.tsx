"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Columns3 } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

export function useColumnVisibility(columns: ColumnDef[]) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    columns.forEach((c) => { init[c.key] = c.defaultVisible !== false; });
    return init;
  });

  const toggle = (key: string) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const isVisible = (key: string) => visible[key] !== false;

  return { visible, toggle, isVisible };
}

export function ColumnToggle({
  columns,
  visible,
  onToggle,
}: {
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary text-xs py-1.5 gap-1"
        title="Toggle columns"
      >
        <Columns3 className="w-3.5 h-3.5" />
        Columns
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => onToggle(col.key)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-surface-50"
            >
              {visible[col.key] !== false ? (
                <Eye className="w-3.5 h-3.5 text-primary-500" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-surface-300" />
              )}
              <span className={cn(visible[col.key] === false && "text-surface-400")}>{col.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
