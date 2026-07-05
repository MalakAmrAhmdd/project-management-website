// src/components/MilestonePanel.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate } from "@/lib/utils";
import { Member, ContributionRow } from "@/types";
import { useMemberAllocations } from "@/hooks/useMemberAllocations";
import {
  Calendar, Users, TrendingUp, Activity, Plus, Trash2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { MiniStat } from "@/components/Management/MiniStat";
import { AllocationRow } from "@/components/Management/AllocationRow";

export function MilestonePanel({ milestoneId, milestoneInfo, members }: {
  milestoneId: number;
  milestoneInfo?: { name: string; projectName: string };
  members: Member[];
}) {
  const { data: milestone } = useQuery({
    queryKey: ["milestone", milestoneId],
    queryFn: () => api.getMilestone(milestoneId),
  });

  const { data: contribs } = useQuery({
    queryKey: ["milestone-contribs", milestoneId],
    queryFn: () => api.getMilestoneContributions(milestoneId),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ["allocations", milestoneId],
    queryFn: () => api.listAllocations({ milestone_id: milestoneId }),
  });

  const { createAlloc, updateAlloc, deleteAlloc } =
    useMemberAllocations({ milestoneId });

  const [addingResource, setAddingResource] = useState(false);
  const [newMemberId, setNewMemberId] = useState<number | "">("");
  const [newVelocity, setNewVelocity] = useState("8");
  const [newContrib, setNewContrib] = useState("1.0");

const contributions: ContributionRow[] = contribs?.contributions || [];
const totalVelocity = contributions.reduce((sum: number, c: ContributionRow) => sum + c.effective_velocity, 0);
  const avgVelocity = contributions.length > 0 ? totalVelocity / contributions.length : 0;

  // Velocity bar chart data
  const velocityData = contributions.map((c) => ({
    name: c.member_name?.split(" ")[0] || "?",
    velocity: c.effective_velocity,
    contribution: c.contribution_percentage * 100,
  }));

  // Already allocated member IDs
  const allocatedMemberIds = new Set(allocations.map((a) => a.member_id));

  return (
    <div className="card overflow-hidden">
      <div className="bg-surface-50 px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-surface-800">{milestoneInfo?.name || `Milestone ${milestoneId}`}</h3>
          <p className="text-xs text-surface-500">{milestoneInfo?.projectName}</p>
        </div>
        {milestone && (
          <span className={cn("badge", getStateColor(milestone.state))}>{milestone.state}</span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MiniStat icon={Calendar} label="Start Date" value={formatDate(milestone?.actual_start_date || milestone?.original_start_date)} />
          <MiniStat icon={Users} label="Resources" value={milestone?.num_allocated_resources ?? 0} />
          <MiniStat icon={TrendingUp} label="Avg Velocity" value={`${avgVelocity.toFixed(1)} pts/wk`} />
          <MiniStat icon={Activity} label="Total Velocity" value={`${totalVelocity.toFixed(1)} pts/wk`} />
          <MiniStat
            icon={Calendar}
            label="Adaptive End"
            value={formatDate(milestone?.adaptive_end_date)}
            highlight
          />
        </div>

        {/* Contribution Matrix Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-surface-700">Contribution Matrix</h4>
            <button onClick={() => setAddingResource(true)} className="btn-primary text-xs py-1.5">
              <Plus className="w-3 h-3" /> Add Resource
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface-50">
                  <th className="text-left px-3 py-2 font-medium text-surface-600">Member</th>
                  <th className="text-right px-3 py-2 font-medium text-surface-600">Velocity (100%)</th>
                  <th className="text-right px-3 py-2 font-medium text-surface-600">Contribution %</th>
                  <th className="text-right px-3 py-2 font-medium text-surface-600">Effective Velocity</th>
                  <th className="text-right px-3 py-2 font-medium text-surface-600">Avg FTO</th>
                  <th className="text-center px-3 py-2 font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addingResource && (
                  <tr className="border-b bg-primary-50">
                    <td className="px-3 py-2">
                      <select
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value ? Number(e.target.value) : "")}
                        className="input py-1 text-sm"
                      >
                        <option value="">Select member...</option>
                        {members
                          .filter((m) => !allocatedMemberIds.has(m.id))
                          .map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                          ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input value={newVelocity} onChange={(e) => setNewVelocity(e.target.value)}
                        className="input py-1 text-sm w-20 text-right" type="number" step="0.5" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={newContrib} onChange={(e) => setNewContrib(e.target.value)}
                        className="input py-1 text-sm w-20 text-right" type="number" step="0.1" min="0" max="1" />
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-surface-400">
                      {(Number(newVelocity) * Number(newContrib)).toFixed(1)}
                    </td>
                    <td></td>
                    <td className="px-3 py-2 text-center space-x-1">
                      <button
                        onClick={() => {
                          if (newMemberId) {
                            createAlloc.mutate({
                              member_id: Number(newMemberId),
                              milestone_id: milestoneId,
                              velocity_if_100_pct: Number(newVelocity),
                              contribution_percentage: Number(newContrib),
                            });
                            setAddingResource(false);
                          }
                        }}
                        className="btn-primary text-xs py-1 px-2"
                      >Add</button>
                      <button onClick={() => setAddingResource(false)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                    </td>
                  </tr>
                )}
                {contributions.map((c) => (
                  <AllocationRow
                    key={c.allocation_id}
                    contribution={c}
                    onUpdate={(data) => updateAlloc.mutate({ id: c.allocation_id, ...data })}
                    onDelete={() => {
                      if (confirm(`Remove ${c.member_name} from this milestone?`))
                        deleteAlloc.mutate(c.allocation_id);
                    }}
                  />
                ))}
                {contributions.length === 0 && !addingResource && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-surface-400 text-xs">
                      No resources allocated. Add a resource to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Velocity Chart */}
        {velocityData.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-surface-700 mb-3">Resource Velocity Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Effective Velocity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}