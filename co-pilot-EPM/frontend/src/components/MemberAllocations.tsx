// src/components/MemberAllocations.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, flattenMilestones } from "@/lib/utils";
import { Allocation, ContributionRow } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { useMemberAllocations } from "@/hooks/useMemberAllocations";
import { Plus, Trash2 } from "lucide-react";

export function MemberAllocations({ memberId }: { memberId: number }) {
  const [adding, setAdding] = useState(false);
  const [newMsId, setNewMsId] = useState<number | "">("");
  const [newVelocity, setNewVelocity] = useState("8");
  const [newContrib, setNewContrib] = useState("1.0");

  const { data: contributions } = useQuery({
    queryKey: ["member-contributions", memberId],
    queryFn: () => api.getMemberContributions(memberId),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["project-timeline"],
    queryFn: api.projectTimeline,
  });

  const { createAlloc, updateAlloc, deleteAlloc } =
    useMemberAllocations({ memberId });

  // Build flat list of milestones from timeline for the "add" dropdown
  const allMilestones = flattenMilestones(timeline);
  const contribs: ContributionRow[] = contributions?.contributions || [];  
  const allocatedMsIds = new Set(
  (contributions?.contributions as ContributionRow[] || []).map((c) => c.milestone_id)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-surface-700">Allocations</h4>
        <button onClick={() => setAdding(true)} className="btn-primary text-xs py-1 px-2">
          <Plus className="w-3 h-3" /> Add Allocation
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-surface-500">Project</th>
            <th className="text-left py-2 px-2 font-medium text-surface-500">Milestone</th>
            <th className="text-left py-2 px-2 font-medium text-surface-500">State</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Velocity (100%)</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Contribution %</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Effective Velocity</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Avg FTO</th>
            <th className="text-center py-2 px-2 font-medium text-surface-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {adding && (
            <tr className="border-b border-surface-100 bg-primary-50">
              <td colSpan={2} className="py-2 px-2">
                <select
                  value={newMsId}
                  onChange={(e) => setNewMsId(e.target.value ? Number(e.target.value) : "")}
                  className="input py-1 px-2 text-xs w-full"
                >
                  <option value="">Select milestone...</option>
                  {allMilestones
                    .filter((ms) => !allocatedMsIds.has(ms.id))
                    .map((ms) => (
                      <option key={ms.id} value={ms.id}>{ms.projectName} — {ms.name}</option>
                    ))}
                </select>
              </td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2">
                <input value={newVelocity} onChange={(e) => setNewVelocity(e.target.value)}
                  className="input py-1 px-1 text-xs w-16 text-right" type="number" step="0.5" />
              </td>
              <td className="py-2 px-2">
                <input value={newContrib} onChange={(e) => setNewContrib(e.target.value)}
                  className="input py-1 px-1 text-xs w-16 text-right" type="number" step="0.1" min="0" max="1" />
              </td>
              <td className="py-2 px-2 text-right font-mono text-surface-400">
                {(Number(newVelocity) * Number(newContrib)).toFixed(1)}
              </td>
              <td></td>
              <td className="py-2 px-2 text-center space-x-1">
                <button
                  onClick={() => {
                    if (newMsId) {
                      createAlloc.mutate(
                      {
                        member_id: memberId,
                        milestone_id: Number(newMsId),
                        velocity_if_100_pct: Number(newVelocity),
                        contribution_percentage: Number(newContrib),
                      },
                      {
                        onSuccess: () => setAdding(false), // ← stays in component
                      }
                    );
                    }
                  }}
                  className="btn-primary text-xs py-0.5 px-2"
                >Add</button>
                <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-0.5 px-2">Cancel</button>
              </td>
            </tr>
          )}
          {contribs.map((c: any) => (
            <AllocationEditRow
              key={c.allocation_id}
              contribution={c}
              onUpdate={(data) => updateAlloc.mutate({ id: c.allocation_id, ...data })}
              onDelete={() => {
                if (confirm(`Remove allocation to ${c.milestone_name}?`))
                  deleteAlloc.mutate(c.allocation_id);
              }}
            />
          ))}
          {contribs.length === 0 && !adding && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-surface-400 text-xs">
                No allocations. Click "Add Allocation" to assign to a milestone.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AllocationEditRow({ contribution, onUpdate, onDelete }: {
  contribution: ContributionRow;
  onUpdate: (data: Partial<Allocation>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-surface-100 hover:bg-white group">
      <td className="py-2 px-2">{contribution.project_name}</td>
      <td className="py-2 px-2 font-medium">{contribution.milestone_name}</td>
      <td className="py-2 px-2">
        <span className={cn("badge text-xs",
          contribution.milestone_state === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
        )}>{contribution.milestone_state}</span>
      </td>
      <td className="py-2 px-2 text-right">
        <InlineInput
          value={String(contribution.velocity_if_100_pct)}
          onSave={(v) => onUpdate({ velocity_if_100_pct: Number(v) })}
          type="number"
          align="right"
          className="font-mono w-16"
        />
      </td>
      <td className="py-2 px-2 text-right">
        <InlineInput
          value={String((contribution.contribution_percentage * 100).toFixed(0))}
          onSave={(v) => onUpdate({ contribution_percentage: Number(v) / 100 })}
          type="number"
          align="right"
          className="font-mono w-16"
        />
      </td>
      <td className="py-2 px-2 text-right font-mono">{contribution.effective_velocity.toFixed(1)}</td>
      <td className="py-2 px-2 text-right font-mono">{contribution.average_fto}</td>
      <td className="py-2 px-2 text-center">
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
          <Trash2 className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
