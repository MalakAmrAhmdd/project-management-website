"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Member } from "@/types";
import { Users, Plus, Trash2 } from "lucide-react";
import { InlineInput } from "@/components/InlineInput";
import { useMemberAllocations } from "@/hooks/useMemberAllocations";

interface AllocationPanelProps {
  milestoneId: number;
  milestoneName: string;
  members: Member[];
  projectId: number;
}

export function AllocationPanel({ milestoneId, milestoneName, members, projectId }: AllocationPanelProps) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newMemberId, setNewMemberId] = useState<number | "">("");
  const [newVelocity, setNewVelocity] = useState("8");
  const [newContrib, setNewContrib] = useState("1.0");

  const { data: contribs } = useQuery({
    queryKey: ["milestone-contribs", milestoneId],
    queryFn: () => api.getMilestoneContributions(milestoneId),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ["allocations", milestoneId],
    queryFn: () => api.listAllocations({ milestone_id: milestoneId }),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["milestone-contribs", milestoneId] });
    qc.invalidateQueries({ queryKey: ["allocations", milestoneId] });
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const { createAlloc, updateAlloc, deleteAlloc } = useMemberAllocations({ milestoneId });

  const contributions = contribs?.contributions || [];
  const allocatedMemberIds = new Set(allocations.map((a: any) => a.member_id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-xs text-surface-700">
          <Users className="w-3 h-3 inline mr-1" />
          Allocations — {milestoneName}
        </h4>
        <button onClick={() => setAdding(true)} className="btn-primary text-xs py-0.5 px-2">
          <Plus className="w-3 h-3" /> Add Resource
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1.5 px-2 font-medium text-surface-500">Member</th>
            <th className="text-right py-1.5 px-2 font-medium text-surface-500">Velocity (100%)</th>
            <th className="text-right py-1.5 px-2 font-medium text-surface-500">Contribution %</th>
            <th className="text-right py-1.5 px-2 font-medium text-surface-500">Effective Velocity</th>
            <th className="text-right py-1.5 px-2 font-medium text-surface-500">Avg FTO</th>
            <th className="text-center py-1.5 px-2 font-medium text-surface-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {adding && (
            <tr className="border-b bg-primary-50">
              <td className="py-1.5 px-2">
                <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value ? Number(e.target.value) : "")}
                  className="input py-0.5 text-xs w-full">
                  <option value="">Select member...</option>
                  {members.filter((m) => !allocatedMemberIds.has(m.id)).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </td>
              <td className="py-1.5 px-2">
                <input value={newVelocity} onChange={(e) => setNewVelocity(e.target.value)}
                  className="input py-0.5 text-xs w-16 text-right" type="number" step="0.5" />
              </td>
              <td className="py-1.5 px-2">
                <input value={newContrib} onChange={(e) => setNewContrib(e.target.value)}
                  className="input py-0.5 text-xs w-16 text-right" type="number" step="0.1" min="0" max="1" />
              </td>
              <td className="py-1.5 px-2 text-right text-surface-400">
                {(Number(newVelocity) * Number(newContrib)).toFixed(1)}
              </td>
              <td></td>
              <td className="py-1.5 px-2 text-center space-x-1">
                <button onClick={() => {
                  if (newMemberId) {
                    createAlloc.mutate({
                      member_id: Number(newMemberId),
                      milestone_id: milestoneId,
                      velocity_if_100_pct: Number(newVelocity),
                      contribution_percentage: Number(newContrib),
                    });
                  }
                }} className="btn-primary text-xs py-0.5 px-2">Add</button>
                <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-0.5 px-2">Cancel</button>
              </td>
            </tr>
          )}
          {contributions.map((c: any) => (
            <tr key={c.allocation_id} className="border-b hover:bg-white group">
              <td className="py-1.5 px-2 font-medium">{c.member_name}</td>
              <td className="py-1.5 px-2 text-right">
                <InlineInput
                  value={String(c.velocity_if_100_pct)}
                  onSave={(v) => updateAlloc.mutate({ id: c.allocation_id, velocity_if_100_pct: Number(v) })}
                  type="number"
                  align="right"
                  className="font-mono w-16"
                />
              </td>
              <td className="py-1.5 px-2 text-right">
                <InlineInput
                  value={String((c.contribution_percentage * 100).toFixed(0))}
                  onSave={(v) => updateAlloc.mutate({ id: c.allocation_id, contribution_percentage: Number(v) / 100 })}
                  type="number"
                  align="right"
                  className="font-mono w-16"
                />
              </td>
              <td className="py-1.5 px-2 text-right font-mono">{c.effective_velocity.toFixed(1)}</td>
              <td className="py-1.5 px-2 text-right font-mono">{c.average_fto}</td>
              <td className="py-1.5 px-2 text-center">
                <button onClick={() => { if (confirm(`Remove ${c.member_name}?`)) deleteAlloc.mutate(c.allocation_id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
          {contributions.length === 0 && !adding && (
            <tr>
              <td colSpan={6} className="text-center py-3 text-surface-400 text-xs">
                No resources allocated yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}