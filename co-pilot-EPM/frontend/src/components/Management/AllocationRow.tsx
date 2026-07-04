// src/components/AllocationRow.tsx
"use client";

import { useState } from "react";
import { Allocation, ContributionRow } from "@/types";
import { Trash2 } from "lucide-react";

export function AllocationRow({
  contribution,
  onUpdate,
  onDelete,
}: {
  contribution: ContributionRow;
  onUpdate: (data: Partial<Allocation>) => void;
  onDelete: () => void;
}) {
  const [editingVel, setEditingVel] = useState(false);
  const [editingContrib, setEditingContrib] = useState(false);
  const [velDraft, setVelDraft] = useState(String(contribution.velocity_if_100_pct));
  const [contribDraft, setContribDraft] = useState(String(contribution.contribution_percentage));

  return (
    <tr className="border-b hover:bg-surface-50 group">
      <td className="px-3 py-2 font-medium">{contribution.member_name}</td>
      <td className="px-3 py-2 text-right">
        {editingVel ? (
          <input
            autoFocus
            value={velDraft}
            onChange={(e) => setVelDraft(e.target.value)}
            onBlur={() => {
              onUpdate({ velocity_if_100_pct: Number(velDraft) });
              setEditingVel(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate({ velocity_if_100_pct: Number(velDraft) });
                setEditingVel(false);
              }
            }}
            className="input py-0.5 px-1 text-sm w-20 text-right"
            type="number"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setVelDraft(String(contribution.velocity_if_100_pct));
              setEditingVel(true);
            }}
            className="cell-editable inline-block rounded text-right font-mono"
          >
            {contribution.velocity_if_100_pct}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editingContrib ? (
          <input
            autoFocus
            value={contribDraft}
            onChange={(e) => setContribDraft(e.target.value)}
            onBlur={() => {
              onUpdate({ contribution_percentage: Number(contribDraft) });
              setEditingContrib(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate({ contribution_percentage: Number(contribDraft) });
                setEditingContrib(false);
              }
            }}
            className="input py-0.5 px-1 text-sm w-20 text-right"
            type="number"
            step="0.1"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setContribDraft(String(contribution.contribution_percentage));
              setEditingContrib(true);
            }}
            className="cell-editable inline-block rounded text-right font-mono"
          >
            {(contribution.contribution_percentage * 100).toFixed(0)}%
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {contribution.effective_velocity.toFixed(1)}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {contribution.average_fto}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}