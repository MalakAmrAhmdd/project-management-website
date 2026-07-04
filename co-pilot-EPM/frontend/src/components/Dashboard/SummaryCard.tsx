// src/components/SummaryCard.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  alert = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("card p-5", alert && "ring-2 ring-red-300")}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white",
          color
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-surface-500">{label}</p>
        </div>
        {alert && (
          <AlertTriangle className="w-5 h-5 text-red-500 ml-auto animate-pulse" />
        )}
      </div>
    </div>
  );
}