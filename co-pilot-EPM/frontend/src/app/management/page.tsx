"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, getAllocationColor, formatDate, flattenMilestones } from "@/lib/utils";
import { Project, Milestone, Member, Allocation, ChangeLogEntry, TimelineProject, ContributionRow } from "@/types";
import {
  Target, Users, TrendingUp, Calendar, Plus, Trash2,
  Clock, Activity, History, BarChart3, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import toast from "react-hot-toast";
import { useMemberAllocations } from "@/hooks/useMemberAllocations";

export default function ManagementPage() {
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
const { data: timeline = [] } = useQuery({
    queryKey: ["project-timeline"],
    queryFn: api.projectTimeline,
  });  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => api.listMembers() });

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<number[]>([]);
  const [tab, setTab] = useState<"milestone" | "timeline" | "changelog">("milestone");

  // Build a flat list of all milestones from timeline
  const allMilestones = flattenMilestones(timeline);

  const projectMilestones = selectedProjectId
    ? allMilestones.filter(ms => {
        const proj = timeline.find(p => p.id === selectedProjectId);
        return proj?.phases.some(ph => ph.milestones.some(m => m.id === ms.id));
      })
    : allMilestones;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Project Management</h1>
        <p className="text-surface-500 text-sm mt-1">Manage milestones, allocations, and track project timelines</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Project</label>
          <select
            value={selectedProjectId ?? ""}
            onChange={(e) => {
              setSelectedProjectId(e.target.value ? Number(e.target.value) : null);
              setSelectedMilestones([]);
            }}
            className="input w-64"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-surface-600 mb-1">Select Milestones</label>
          <div className="flex flex-wrap gap-2">
            {projectMilestones.map((ms) => (
              <button
                key={ms.id}
                onClick={() => {
                  setSelectedMilestones((prev) =>
                    prev.includes(ms.id) ? prev.filter((id) => id !== ms.id) : [...prev, ms.id]
                  );
                }}
                className={cn(
                  "badge cursor-pointer border transition-colors",
                  selectedMilestones.includes(ms.id)
                    ? "bg-primary-100 text-primary-700 border-primary-300"
                    : "bg-white text-surface-600 border-surface-300 hover:bg-surface-50"
                )}
              >
                {ms.name}
                <span className={cn("ml-1 w-1.5 h-1.5 rounded-full inline-block",
                  ms.state === "ACTIVE" ? "bg-blue-500" :
                  ms.state === "COMPLETED" ? "bg-green-500" : "bg-gray-300"
                )} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {[
          { key: "milestone" as const, label: "Milestone Details", icon: Target },
          { key: "timeline" as const, label: "Project Timeline", icon: BarChart3 },
          { key: "changelog" as const, label: "Change History", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-surface-500 hover:text-surface-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "milestone" && (
        <MilestoneDetailsTab
          selectedMilestones={selectedMilestones}
          allMilestones={allMilestones}
          members={members}
        />
      )}
      {tab === "timeline" && (
        <TimelineTab
          timeline={timeline}
          selectedProjectId={selectedProjectId}
        />
      )}
      {tab === "changelog" && (
        <ChangelogTab selectedMilestones={selectedMilestones} />
      )}
    </div>
  );
}

/* ── Milestone Details Tab ── */
function MilestoneDetailsTab({ selectedMilestones, allMilestones, members }: {
  selectedMilestones: number[];
  allMilestones: { id: number; name: string; projectName: string }[];
  members: Member[];
}) {
  if (selectedMilestones.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Target className="w-12 h-12 text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500">Select one or more milestones above to view details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedMilestones.map((msId) => (
        <MilestonePanel
          key={msId}
          milestoneId={msId}
          milestoneInfo={allMilestones.find((m) => m.id === msId)}
          members={members}
        />
      ))}
    </div>
  );
}

function MilestonePanel({ milestoneId, milestoneInfo, members }: {
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
  const totalVelocity = contributions.reduce((sum: number, c: any) => sum + c.effective_velocity, 0);
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
                {contributions.map((c: any) => (
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

function AllocationRow({ contribution, onUpdate, onDelete }: {
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
            onBlur={() => { onUpdate({ velocity_if_100_pct: Number(velDraft) }); setEditingVel(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onUpdate({ velocity_if_100_pct: Number(velDraft) }); setEditingVel(false); } }}
            className="input py-0.5 px-1 text-sm w-20 text-right"
            type="number"
          />
        ) : (
          <span
            onDoubleClick={() => { setVelDraft(String(contribution.velocity_if_100_pct)); setEditingVel(true); }}
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
            onBlur={() => { onUpdate({ contribution_percentage: Number(contribDraft) }); setEditingContrib(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onUpdate({ contribution_percentage: Number(contribDraft) }); setEditingContrib(false); } }}
            className="input py-0.5 px-1 text-sm w-20 text-right"
            type="number"
            step="0.1"
          />
        ) : (
          <span
            onDoubleClick={() => { setContribDraft(String(contribution.contribution_percentage)); setEditingContrib(true); }}
            className="cell-editable inline-block rounded text-right font-mono"
          >
            {(contribution.contribution_percentage * 100).toFixed(0)}%
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-mono">{contribution.effective_velocity.toFixed(1)}</td>
      <td className="px-3 py-2 text-right font-mono">{contribution.average_fto}</td>
      <td className="px-3 py-2 text-center">
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
          <Trash2 className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}

/* ── Timeline Tab ── */
function TimelineTab({ timeline, selectedProjectId }: {
  timeline: TimelineProject[];
  selectedProjectId: number | null;
}) {
  const filtered = selectedProjectId
    ? timeline.filter((p) => p.id === selectedProjectId)
    : timeline;

  if (filtered.length === 0) {
    return (
      <div className="card p-12 text-center">
        <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500">No project timeline data available</p>
      </div>
    );
  }

  // Build Gantt-like data
  let allDates: string[] = [];
  filtered.forEach((proj) => {
    if (proj.start_date) allDates.push(proj.start_date);
    if (proj.end_date) allDates.push(proj.end_date);
    proj.phases.forEach((ph) => {
      ph.milestones.forEach((ms) => {
        if (ms.start_date) allDates.push(ms.start_date);
        if (ms.end_date) allDates.push(ms.end_date);
      });
    });
  });

  allDates = allDates.filter((d) => d && d !== "None" && d !== "");
  const minDate = allDates.length > 0 ? new Date(allDates.sort()[0]) : new Date();
  const maxDate = allDates.length > 0 ? new Date(allDates.sort().reverse()[0]) : new Date();
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const getBarStyle = (start: string, end: string) => {
    if (!start || !end || start === "None" || end === "None") return { left: "0%", width: "0%" };
    const s = new Date(start);
    const e = new Date(end);
    const left = Math.max(0, (s.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    const width = Math.max(1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  const stateBarClass = (state: string, isPlaceholder: boolean) => {
    if (isPlaceholder) return "gantt-bar-placeholder";
    switch (state) {
      case "ACTIVE": return "gantt-bar-active";
      case "COMPLETED": return "gantt-bar-completed";
      case "ON_HOLD": return "gantt-bar-onhold";
      case "PENDING": return "gantt-bar-pending";
      default: return "gantt-bar-notstarted";
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-surface-800">Gantt Timeline</h3>

      {/* Date axis labels */}
      <div className="relative h-6 border-b border-surface-200 text-[10px] text-surface-400">
        <span className="absolute left-0">{formatDate(minDate.toISOString())}</span>
        <span className="absolute left-1/4">{formatDate(new Date(minDate.getTime() + totalDays * 0.25 * 86400000).toISOString())}</span>
        <span className="absolute left-1/2 -translate-x-1/2">{formatDate(new Date(minDate.getTime() + totalDays * 0.5 * 86400000).toISOString())}</span>
        <span className="absolute left-3/4">{formatDate(new Date(minDate.getTime() + totalDays * 0.75 * 86400000).toISOString())}</span>
        <span className="absolute right-0">{formatDate(maxDate.toISOString())}</span>
      </div>

      {filtered.map((proj) => (
        <div key={proj.id} className="space-y-2">
          {/* Project bar */}
          <div className="flex items-center gap-3">
            <div className="w-48 shrink-0">
              <div className="text-sm font-semibold text-surface-800 truncate">{proj.name}</div>
              <div className="text-[10px] text-surface-400">{formatDate(proj.start_date)} — {formatDate(proj.end_date)}</div>
            </div>
            <div className="flex-1 relative h-7 bg-surface-100 rounded">
              <div
                className={cn("gantt-bar absolute top-0.5", stateBarClass(proj.state, false))}
                style={getBarStyle(proj.start_date, proj.end_date)}
              />
            </div>
          </div>

          {/* Phase + Milestone bars */}
          {proj.phases.map((phase) => (
            <div key={phase.id} className="space-y-1">
              <div className="flex items-center gap-3 pl-4">
                <div className="w-44 shrink-0 text-xs text-surface-600 truncate">{phase.name}</div>
                <div className="flex-1 relative h-5 bg-surface-50 rounded">
                  <div
                    className={cn("gantt-bar absolute top-0.5 opacity-40", stateBarClass(phase.state, phase.is_placeholder))}
                    style={getBarStyle(phase.start_date, phase.end_date)}
                  />
                </div>
              </div>
              {phase.milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-3 pl-8">
                  <div className="w-40 shrink-0">
                    <div className="text-[11px] text-surface-500 truncate flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {ms.name}
                    </div>
                    <div className="text-[9px] text-surface-400 pl-4">{formatDate(ms.start_date)} — {formatDate(ms.end_date)}</div>
                  </div>
                  <div className="flex-1 relative h-4 bg-surface-50 rounded">
                    <div
                      className={cn("gantt-bar absolute top-0", stateBarClass(ms.state, ms.is_placeholder))}
                      style={getBarStyle(ms.start_date, ms.end_date)}
                    >
                      {ms.original_end_date && ms.original_end_date !== ms.end_date && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-red-500"
                          style={{
                            left: (() => {
                              const s = new Date(ms.start_date);
                              const oe = new Date(ms.original_end_date);
                              const ae = new Date(ms.end_date);
                              const barDays = (ae.getTime() - s.getTime()) / 86400000;
                              const origDays = (oe.getTime() - s.getTime()) / 86400000;
                              return barDays > 0 ? `${(origDays / barDays) * 100}%` : "0%";
                            })(),
                          }}
                          title={`Original end: ${formatDate(ms.original_end_date)}`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-surface-400 w-20 text-right shrink-0">
                    {ms.total_estimated_points}pts / {ms.num_allocated_resources}res
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Changelog Tab ── */
function ChangelogTab({ selectedMilestones }: { selectedMilestones: number[] }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["changelog"],
    queryFn: () => api.listChangelog({ limit: 100 }),
  });

  const filtered = selectedMilestones.length > 0
    ? logs.filter((l) => selectedMilestones.some((msId) =>
        (l.entity_type === "milestone" && l.entity_id === msId) || l.entity_type !== "milestone"
      ))
    : logs;

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-surface-800 mb-4">Change History</h3>
      {filtered.length === 0 ? (
        <p className="text-center text-surface-400 py-8">No changes recorded yet</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-surface-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-surface-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="badge bg-surface-100 text-surface-600">{log.entity_type}</span>
                  <span className="font-medium">{log.field_changed}</span>
                </div>
                <div className="text-xs text-surface-500 mt-1">
                  <span className="line-through text-red-400">{log.old_value || "null"}</span>
                  {" → "}
                  <span className="text-green-600 font-medium">{log.new_value || "null"}</span>
                </div>
                {log.reason && (
                  <p className="text-xs text-surface-400 mt-0.5 italic">{log.reason}</p>
                )}
                <p className="text-[10px] text-surface-300 mt-1">
                  {new Date(log.changed_at).toLocaleString()} by {log.changed_by}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, highlight = false }: {
  icon: any; label: string; value: string | number; highlight?: boolean;
}) {
  return (
    <div className={cn("p-3 rounded-lg border", highlight ? "bg-primary-50 border-primary-200" : "bg-surface-50 border-surface-200")}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", highlight ? "text-primary-600" : "text-surface-400")} />
        <span className="text-xs text-surface-500">{label}</span>
      </div>
      <p className={cn("text-lg font-bold mt-1", highlight ? "text-primary-600" : "text-surface-800")}>{value}</p>
    </div>
  );
}
