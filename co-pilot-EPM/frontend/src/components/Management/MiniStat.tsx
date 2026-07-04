// src/components/MiniStat.tsx
import React from "react";
import { cn } from "@/lib/utils";

export function MiniStat({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      highlight ? "bg-primary-50 border-primary-200" : "bg-surface-50 border-surface-200"
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", highlight ? "text-primary-600" : "text-surface-400")} />
        <span className="text-xs text-surface-500">{label}</span>
      </div>
      <p className={cn(
        "text-lg font-bold mt-1",
        highlight ? "text-primary-600" : "text-surface-800"
      )}>
        {value}
      </p>
    </div>
  );
}