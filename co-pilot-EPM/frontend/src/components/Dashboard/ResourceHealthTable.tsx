// src/components/ResourceHealthTable.tsx
"use client";

import { cn, getAllocationColor } from "@/lib/utils";
import Link from "next/link";

interface ResourceHealth {
  id: number;
  name: string;
  email: string;
  allocation_percentage: number;
  overall_avg_velocity: number;
  status: string;
}

export function ResourceHealthTable({ health }: { health: ResourceHealth[] | undefined }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-surface-800">Resource Allocation Overview</h2>
        <Link href="/resources" className="text-primary-600 text-sm font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="text-left py-3 px-3 font-medium text-surface-600">Name</th>
              <th className="text-left py-3 px-3 font-medium text-surface-600">Email</th>
              <th className="text-right py-3 px-3 font-medium text-surface-600">Allocation %</th>
              <th className="text-right py-3 px-3 font-medium text-surface-600">Avg Velocity</th>
              <th className="text-left py-3 px-3 font-medium text-surface-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {health?.map((m) => (
              <tr key={m.id} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer">
                <td className="py-3 px-3 font-medium">
                  <Link href="/resources" className="hover:text-primary-600">{m.name}</Link>
                </td>
                <td className="py-3 px-3 text-surface-500">{m.email}</td>
                <td className="py-3 px-3 text-right">
                  <span className={cn("badge", getAllocationColor(m.allocation_percentage))}>
                    {(m.allocation_percentage * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {m.overall_avg_velocity.toFixed(1)} pts/wk
                </td>
                <td className="py-3 px-3">
                  <span className={cn("badge", getAllocationColor(m.allocation_percentage))}>
                    {m.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}