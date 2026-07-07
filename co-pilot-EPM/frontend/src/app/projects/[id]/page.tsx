"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity, incrementName } from "@/lib/utils";
import { ProjectFull, ItemState, Phase, Milestone, Epic, Story, Allocation, Member } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ColumnToggle";
import {
  ChevronDown, ChevronRight, Plus, Trash2, ArrowLeft,
  ArrowUp, ArrowDown, Target, Layers, BookOpen, FileText, Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useMemberAllocations } from "@/hooks/useMemberAllocations";

/** Today's date as YYYY-MM-DD string */
const TODAY = new Date().toISOString().split("T")[0];

/**
 * Returns null if the state change to ACTIVE is permitted,
 * or a human-readable error string if it should be blocked.
 */
function canActivate(startDate: string | null | undefined, endDate: string | null | undefined): string | null {
  if (startDate && startDate > TODAY)
    return `Start date (${formatDate(startDate)}) is after today (${formatDate(TODAY)})`;
  if (endDate && endDate < TODAY)
    return `End date (${formatDate(endDate)}) is already in the past (today is ${formatDate(TODAY)})`;
  return null;
}

const STATES: ItemState[] = ["NOT_STARTED", "ACTIVE", "ON_HOLD", "PENDING", "COMPLETED"];

const HIERARCHY_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "state", label: "State" },
  { key: "points", label: "Est. Points" },
  { key: "resources", label: "Resources" },
  { key: "start", label: "Start Date" },
  { key: "end", label: "Original End" },
  { key: "adaptive", label: "Adaptive End" },
  { key: "duration", label: "Duration" },
  { key: "velocity", label: "Velocity", defaultVisible: false },
  { key: "actions", label: "Actions" },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const qc = useQueryClient();
  const { visible, toggle, isVisible } = useColumnVisibility(HIERARCHY_COLUMNS);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
  });

  const updateProject = useMutation({
    mutationFn: ({ pid, ...data }: { pid: number } & Partial<any>) => api.updateProject(pid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Project updated"); },
  });

  const createPhase = useMutation({
    mutationFn: api.createPhase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Phase added"); },
  });

  const createMilestone = useMutation({
    mutationFn: api.createMilestone,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Milestone added"); },
  });

  const createEpic = useMutation({
    mutationFn: api.createEpic,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Epic added"); },
  });

  const createStory = useMutation({
    mutationFn: api.createStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Story added"); },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
  });

  if (isLoading) return <div className="text-center py-12 text-surface-400">Loading...</div>;
  if (!project) return <div className="text-center py-12 text-surface-400">Project not found</div>;

  // Smart add phase: inherit from previous
  const handleAddPhase = () => {
    const phases = project.phases;
    const last = phases[phases.length - 1];
    const newData: any = { name: "New Phase", project_id: project.id };
    if (last) {
      newData.name = incrementName(last.name);
      newData.state = last.state;
      newData.original_start_date = last.adaptive_end_date || last.original_end_date || undefined;
      newData.original_end_date = last.original_end_date || undefined;
    }
    createPhase.mutate(newData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-surface-400 hover:text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <InlineInput
              value={project.name}
              onSave={(v) => updateProject.mutate({ pid: project.id, name: v })}
              className="text-2xl font-bold"
            />
            <select
              value={project.state}
              onChange={(e) => updateProject.mutate({ pid: project.id, state: e.target.value })}
              className={cn("badge cursor-pointer border-0 text-xs", getStateColor(project.state))}
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <InlineInput
            value={project.description || ""}
            onSave={(v) => updateProject.mutate({ pid: project.id, description: v })}
            placeholder="Add description..."
            className="text-surface-500 text-sm mt-1"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <StatCard label="Total Points" value={project.total_estimated_points} />
        <StatCard label="Resources" value={project.num_allocated_resources} />
        <StatCard label="Today" value={formatDate(TODAY)} accent />
        <StatCard label="Start" value={formatDate(project.actual_start_date || project.original_start_date)} />
        <StatCard label="Original End" value={formatDate(project.original_end_date)} />
        <StatCard label="Adaptive End" value={formatDate(project.adaptive_end_date)} highlight />
        <StatCard label="Duration" value={computeDuration(project.actual_start_date || project.original_start_date, project.adaptive_end_date || project.original_end_date)} />
      </div>

      {/* Hierarchy Tree Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-b">
          <h2 className="font-semibold text-surface-800">Project Hierarchy</h2>
          <div className="flex items-center gap-2">
            <ColumnToggle columns={HIERARCHY_COLUMNS} visible={visible} onToggle={toggle} />
            <button
              onClick={handleAddPhase}
              className="btn-primary text-xs py-1.5"
            >
              <Plus className="w-3 h-3" /> Add Phase
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-50">
                {isVisible("name") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-[350px]">Name</th>}
                {isVisible("state") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-24">State</th>}
                {isVisible("points") && <th className="text-right px-3 py-2 font-medium text-surface-600 w-20">Points</th>}
                {isVisible("resources") && <th className="text-right px-3 py-2 font-medium text-surface-600 w-20">Resources</th>}
                {isVisible("start") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-28">Start</th>}
                {isVisible("end") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-28">End</th>}
                {isVisible("adaptive") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-28">Adaptive End</th>}
                {isVisible("duration") && <th className="text-left px-3 py-2 font-medium text-surface-600 w-20">Duration</th>}
                {isVisible("velocity") && <th className="text-right px-3 py-2 font-medium text-surface-600 w-24">Velocity</th>}
                {isVisible("actions") && <th className="text-center px-3 py-2 font-medium text-surface-600 w-28">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {project.phases.map((phase, phaseIdx) => (
                <PhaseRow
                  key={phase.id}
                  phase={phase}
                  phaseIndex={phaseIdx}
                  totalPhases={project.phases.length}
                  onAddMilestone={(data) => createMilestone.mutate(data)}
                  onAddEpic={(msId) => createEpic.mutate({ name: "New Epic", milestone_id: msId })}
                  onAddStory={(epicId) => createStory.mutate({ name: "New Story", epic_id: epicId, estimated_points: 0 })}
                  projectId={projectId}
                  isVisible={isVisible}
                  members={members}
                  onMilestoneActivated={() => {
                    if (project.state !== "ACTIVE") {
                      updateProject.mutate({ pid: project.id, state: "ACTIVE" });
                    }
                  }}
                />
              ))}
              {project.phases.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-surface-400">
                    No phases yet. Add one to start building the project hierarchy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



function PhaseRow({ phase, phaseIndex, totalPhases, onAddMilestone, onAddEpic, onAddStory, projectId, isVisible, members, onMilestoneActivated }: {
  phase: ProjectFull["phases"][number];
  phaseIndex: number;
  totalPhases: number;
  onAddMilestone: (data: any) => void;
  onAddEpic: (msId: number) => void;
  onAddStory: (epicId: number) => void;
  projectId: number;
  isVisible: (key: string) => boolean;
  members: Member[];
  onMilestoneActivated: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["project", projectId] });

  const updatePhase = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Phase>) => api.updatePhase(id, data),
    onSuccess: inv,
  });

  const deletePhase = useMutation({
    mutationFn: api.deletePhase,
    onSuccess: () => { inv(); toast.success("Phase deleted"); },
  });

  const movePhase = (newIndex: number) => {
    updatePhase.mutate({ id: phase.id, order_index: newIndex } as any);
  };

  const startDate = phase.actual_start_date || phase.original_start_date;
  const endDate = phase.adaptive_end_date || phase.original_end_date;

  // Smart add milestone: inherit from last milestone in this phase
  const handleAddMilestone = () => {
    const milestones = phase.milestones;
    const last = milestones[milestones.length - 1];
    const newData: any = { name: "New Milestone", phase_id: phase.id };
    if (last) {
      newData.name = incrementName(last.name);
      newData.state = last.state;
      newData.original_start_date = last.adaptive_end_date || last.original_end_date || undefined;
      newData.original_end_date = last.original_end_date || undefined;
      newData.total_estimated_points = last.total_estimated_points;
    }
    onAddMilestone(newData);
  };

  return (
    <>
      <tr className={cn("border-b hover:bg-surface-50 group", phase.is_placeholder && "row-placeholder")}>
        {isVisible("name") && (
          <td className="px-3 py-1">
            <div className="flex items-center gap-2">
              <button onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
              </button>
              <Layers className="w-4 h-4 text-blue-500 shrink-0" />
              <InlineInput value={phase.name} onSave={(v) => updatePhase.mutate({ id: phase.id, name: v })} className="font-semibold" />
              {phase.is_placeholder && <span className="badge bg-gray-100 text-gray-500 text-[10px]">placeholder</span>}
            </div>
          </td>
        )}
        {isVisible("state") && (
          <td className="px-3 py-1">
            <select value={phase.state} onChange={(e) => {
              const next = e.target.value as ItemState;
              if (next === "ACTIVE") {
                const err = canActivate(startDate, phase.adaptive_end_date);
                if (err) { toast.error(`Cannot set to ACTIVE: ${err}`); return; }
              }
              updatePhase.mutate({ id: phase.id, state: next });
            }} className={cn("badge border-0 cursor-pointer text-xs", getStateColor(phase.state))}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </td>
        )}
        {isVisible("points") && <td className="px-3 py-1 text-right font-mono text-xs">{phase.total_estimated_points}</td>}
        {isVisible("resources") && <td className="px-3 py-1 text-right font-mono text-xs">{phase.num_allocated_resources}</td>}
        {isVisible("start") && (
          <td className="px-3 py-1">
            <InlineInput
              value={startDate || ""}
              onSave={(v) => {
                const update: any = { id: phase.id, original_start_date: v, actual_start_date: v };
                if (phase.state === "ACTIVE" && v > TODAY) {
                  update.state = "NOT_STARTED";
                  toast("Phase deactivated: start date is now after today.");
                }
                updatePhase.mutate(update);
              }}
              type="date"
              className="text-xs w-28"
            />
          </td>
        )}
        {isVisible("end") && (
          <td className="px-3 py-1">
            <InlineInput
              value={phase.original_end_date || ""}
              onSave={(v) => {
                updatePhase.mutate({ id: phase.id, original_end_date: v } as any, {
                  onSuccess: (data: any) => {
                    if (phase.state === "ACTIVE" && data.adaptive_end_date && data.adaptive_end_date < TODAY) {
                      updatePhase.mutate({ id: phase.id, state: "NOT_STARTED" } as any);
                      toast("Phase deactivated: adaptive end date is now before today.");
                    }
                  },
                });
              }}
              type="date"
              className="text-xs w-28"
            />
          </td>
        )}
        {isVisible("adaptive") && <td className="px-3 py-1 text-xs font-medium">{formatDate(phase.adaptive_end_date)}</td>}
        {isVisible("duration") && <td className="px-3 py-1 text-xs text-surface-500">{computeDuration(startDate, endDate)}</td>}
        {isVisible("velocity") && <td className="px-3 py-1 text-right text-xs text-surface-500">{computeOverallVelocity(phase.total_estimated_points, startDate, endDate)}</td>}
        {isVisible("actions") && (
          <td className="px-3 py-1 text-center">
            <div className="flex items-center gap-0.5 justify-center">
              <button onClick={() => movePhase(phaseIndex - 1)} disabled={phaseIndex === 0}
                className={cn("p-0.5", phaseIndex === 0 ? "text-surface-200" : "text-surface-400 hover:text-surface-700")} title="Move up">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={() => movePhase(phaseIndex + 1)} disabled={phaseIndex === totalPhases - 1}
                className={cn("p-0.5", phaseIndex === totalPhases - 1 ? "text-surface-200" : "text-surface-400 hover:text-surface-700")} title="Move down">
                <ArrowDown className="w-3 h-3" />
              </button>
              <button onClick={handleAddMilestone} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 p-0.5" title="Add Milestone">
                <Plus className="w-3 h-3" />
              </button>
              <button onClick={() => { if (confirm("Delete this phase?")) deletePhase.mutate(phase.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5" title="Delete">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </td>
        )}
      </tr>
      {expanded && phase.milestones.map((ms, msIdx) => (
        <MilestoneRow
          key={ms.id}
          milestone={ms}
          msIndex={msIdx}
          totalMs={phase.milestones.length}
          onAddEpic={() => onAddEpic(ms.id)}
          onAddStory={onAddStory}
          projectId={projectId}
          isVisible={isVisible}
          members={members}
          onActivated={onMilestoneActivated}
        />
      ))}
    </>
  );
}

function MilestoneRow({ milestone: ms, msIndex, totalMs, onAddEpic, onAddStory, projectId, isVisible, members, onActivated }: {
  milestone: ProjectFull["phases"][number]["milestones"][number];
  msIndex: number;
  totalMs: number;
  onAddEpic: () => void;
  onAddStory: (epicId: number) => void;
  projectId: number;
  isVisible: (key: string) => boolean;
  members: Member[];
  onActivated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAlloc, setShowAlloc] = useState(false);
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["project", projectId] });

  const updateMs = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Milestone>) => api.updateMilestone(id, data),
    onSuccess: inv,
  });

  const deleteMs = useMutation({
    mutationFn: api.deleteMilestone,
    onSuccess: () => { inv(); toast.success("Milestone deleted"); },
  });

  const moveMs = (newIndex: number) => {
    updateMs.mutate({ id: ms.id, order_index: newIndex } as any);
  };

  const startDate = ms.actual_start_date || ms.original_start_date;
  const endDate = ms.adaptive_end_date || ms.original_end_date;

  const colCount = ["name", "state", "points", "resources", "start", "end", "adaptive", "duration", "velocity", "actions"].filter(isVisible).length;

  return (
    <>
      <tr className={cn("border-b hover:bg-surface-50 group", ms.is_placeholder && "row-placeholder")}>
        {isVisible("name") && (
          <td className="px-3 py-1 pl-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown className="w-3 h-3 text-surface-400" /> : <ChevronRight className="w-3 h-3 text-surface-400" />}
              </button>
              <Target className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <InlineInput value={ms.name} onSave={(v) => updateMs.mutate({ id: ms.id, name: v })} />
              {ms.is_placeholder && <span className="badge bg-gray-100 text-gray-500 text-[10px]">placeholder</span>}
            </div>
          </td>
        )}
        {isVisible("state") && (
          <td className="px-3 py-1">
            <select value={ms.state} onChange={(e) => {
              const next = e.target.value as ItemState;
              if (next === "ACTIVE") {
                const err = canActivate(startDate, ms.adaptive_end_date);
                if (err) { toast.error(`Cannot set to ACTIVE: ${err}`); return; }
              }
              updateMs.mutate(
                { id: ms.id, state: next },
                { onSuccess: () => { if (next === "ACTIVE") onActivated(); } }
              );
            }} className={cn("badge border-0 cursor-pointer text-xs", getStateColor(ms.state))}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </td>
        )}
        {isVisible("points") && (
          <td className="px-3 py-1 text-right">
            <InlineInput
              value={String(ms.total_estimated_points)}
              onSave={(v) => updateMs.mutate({ id: ms.id, total_estimated_points: Number(v) } as any)}
              type="number"
              align="right"
              className="font-mono text-xs w-16"
            />
          </td>
        )}
        {isVisible("resources") && <td className="px-3 py-1 text-right font-mono text-xs">{ms.num_allocated_resources}</td>}
        {isVisible("start") && (
          <td className="px-3 py-1">
            <InlineInput
              value={startDate || ""}
              onSave={(v) => {
                const update: any = { id: ms.id, original_start_date: v, actual_start_date: v };
                if (ms.state === "ACTIVE" && v > TODAY) {
                  update.state = "NOT_STARTED";
                  toast("Milestone deactivated: start date is now after today.");
                }
                updateMs.mutate(update);
              }}
              type="date"
              className="text-xs w-28"
            />
          </td>
        )}
        {isVisible("end") && (
          <td className="px-3 py-1">
            <InlineInput
              value={ms.original_end_date || ""}
              onSave={(v) => {
                updateMs.mutate({ id: ms.id, original_end_date: v } as any, {
                  onSuccess: (data: any) => {
                    if (ms.state === "ACTIVE" && data.adaptive_end_date && data.adaptive_end_date < TODAY) {
                      updateMs.mutate({ id: ms.id, state: "NOT_STARTED" } as any);
                      toast("Milestone deactivated: adaptive end date is now before today.");
                    }
                  },
                });
              }}
              type="date"
              className="text-xs w-28"
            />
          </td>
        )}
        {isVisible("adaptive") && <td className="px-3 py-1 text-xs font-medium">{formatDate(ms.adaptive_end_date)}</td>}
        {isVisible("duration") && <td className="px-3 py-1 text-xs text-surface-500">{computeDuration(startDate, endDate)}</td>}
        {isVisible("velocity") && <td className="px-3 py-1 text-right text-xs text-surface-500">{computeOverallVelocity(ms.total_estimated_points, startDate, endDate)}</td>}
        {isVisible("actions") && (
          <td className="px-3 py-1 text-center">
            <div className="flex items-center gap-0.5 justify-center">
              <button onClick={() => moveMs(msIndex - 1)} disabled={msIndex === 0}
                className={cn("p-0.5", msIndex === 0 ? "text-surface-200" : "text-surface-400 hover:text-surface-700")} title="Move up">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={() => moveMs(msIndex + 1)} disabled={msIndex === totalMs - 1}
                className={cn("p-0.5", msIndex === totalMs - 1 ? "text-surface-200" : "text-surface-400 hover:text-surface-700")} title="Move down">
                <ArrowDown className="w-3 h-3" />
              </button>
              <button onClick={() => setShowAlloc(!showAlloc)}
                className={cn("p-0.5", showAlloc ? "text-primary-600" : "text-surface-400 hover:text-surface-700")} title="Allocations">
                <Users className="w-3 h-3" />
              </button>
              <button onClick={onAddEpic} className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 p-0.5" title="Add Epic">
                <Plus className="w-3 h-3" />
              </button>
              <button onClick={() => { if (confirm("Delete this milestone?")) deleteMs.mutate(ms.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </td>
        )}
      </tr>
      {/* Inline allocation panel */}
      {showAlloc && (
        <tr>
          <td colSpan={colCount} className="bg-blue-50/50 px-6 py-3 border-b">
            <AllocationPanel milestoneId={ms.id} milestoneName={ms.name} members={members} projectId={projectId} />
          </td>
        </tr>
      )}
      {expanded && ms.epics.map((epic) => (
        <EpicRow key={epic.id} epic={epic} onAddStory={() => onAddStory(epic.id)} projectId={projectId} isVisible={isVisible} />
      ))}
    </>
  );
}

/* ── Allocation Panel (inline under milestone) ── */
function AllocationPanel({ milestoneId, milestoneName, members, projectId }: {
  milestoneId: number;
  milestoneName: string;
  members: Member[];
  projectId: number;
}) {
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

  const { createAlloc, updateAlloc, deleteAlloc } =
    useMemberAllocations({ milestoneId });
    
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

function EpicRow({ epic, onAddStory, projectId, isVisible }: {
  epic: ProjectFull["phases"][number]["milestones"][number]["epics"][number];
  onAddStory: () => void;
  projectId: number;
  isVisible: (key: string) => boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const updateEpic = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Epic>) => api.updateEpic(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const startDate = epic.actual_start_date || epic.original_start_date;
  const endDate = epic.adaptive_end_date || epic.original_end_date;

  return (
    <>
      <tr className={cn("border-b hover:bg-surface-50 group", epic.is_placeholder && "row-placeholder")}>
        {isVisible("name") && (
          <td className="px-3 py-1 pl-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown className="w-3 h-3 text-surface-400" /> : <ChevronRight className="w-3 h-3 text-surface-400" />}
              </button>
              <BookOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <InlineInput value={epic.name} onSave={(v) => updateEpic.mutate({ id: epic.id, name: v })} />
              {epic.is_placeholder && <span className="badge bg-gray-100 text-gray-500 text-[10px]">placeholder</span>}
            </div>
          </td>
        )}
        {isVisible("state") && (
          <td className="px-3 py-1">
            <span className={cn("badge text-xs", getStateColor(epic.state))}>{epic.state}</span>
          </td>
        )}
        {isVisible("points") && <td className="px-3 py-1 text-right font-mono text-xs">{epic.total_estimated_points}</td>}
        {isVisible("resources") && <td className="px-3 py-1 text-right font-mono text-xs">{epic.num_allocated_resources}</td>}
        {isVisible("start") && <td className="px-3 py-1 text-xs">{formatDate(startDate)}</td>}
        {isVisible("end") && <td className="px-3 py-1 text-xs">{formatDate(epic.original_end_date)}</td>}
        {isVisible("adaptive") && <td className="px-3 py-1 text-xs">{formatDate(epic.adaptive_end_date)}</td>}
        {isVisible("duration") && <td className="px-3 py-1 text-xs text-surface-500">{computeDuration(startDate, endDate)}</td>}
        {isVisible("velocity") && <td className="px-3 py-1 text-right text-xs text-surface-500">{computeOverallVelocity(epic.total_estimated_points, startDate, endDate)}</td>}
        {isVisible("actions") && (
          <td className="px-3 py-1 text-center">
            <button onClick={onAddStory} className="opacity-0 group-hover:opacity-100 text-purple-500 hover:text-purple-700 p-1" title="Add Story">
              <Plus className="w-3 h-3" />
            </button>
          </td>
        )}
      </tr>
      {expanded && epic.stories.map((story) => (
        <StoryRow key={story.id} story={story} projectId={projectId} isVisible={isVisible} />
      ))}
    </>
  );
}

function StoryRow({ story, projectId, isVisible }: { story: Story; projectId: number; isVisible: (key: string) => boolean }) {
  const qc = useQueryClient();

  const updateStory = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Story>) => api.updateStory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const deleteStory = useMutation({
    mutationFn: api.deleteStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Story deleted"); },
  });

  return (
    <tr className={cn("border-b hover:bg-surface-50 group", story.is_placeholder && "row-placeholder")}>
      {isVisible("name") && (
        <td className="px-3 py-1 pl-[88px]">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-orange-400 shrink-0" />
            <InlineInput value={story.name} onSave={(v) => updateStory.mutate({ id: story.id, name: v })} />
            {story.is_placeholder && <span className="badge bg-gray-100 text-gray-500 text-[10px]">placeholder</span>}
          </div>
        </td>
      )}
      {isVisible("state") && (
        <td className="px-3 py-1">
          <span className={cn("badge text-xs", getStateColor(story.state))}>{story.state}</span>
        </td>
      )}
      {isVisible("points") && (
        <td className="px-3 py-1 text-right">
          <InlineInput
            value={String(story.estimated_points)}
            onSave={(v) => updateStory.mutate({ id: story.id, estimated_points: Number(v) })}
            type="number"
            align="right"
            className="font-mono text-xs w-16"
          />
        </td>
      )}
      {isVisible("resources") && <td className="px-3 py-1"></td>}
      {isVisible("start") && <td className="px-3 py-1"></td>}
      {isVisible("end") && <td className="px-3 py-1"></td>}
      {isVisible("adaptive") && <td className="px-3 py-1"></td>}
      {isVisible("duration") && <td className="px-3 py-1"></td>}
      {isVisible("velocity") && <td className="px-3 py-1"></td>}
      {isVisible("actions") && (
        <td className="px-3 py-1 text-center">
          <button onClick={() => { if (confirm("Delete this story?")) deleteStory.mutate(story.id); }}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-3 h-3" />
          </button>
        </td>
      )}
    </tr>
  );
}

function StatCard({ label, value, highlight = false, accent = false }: { label: string; value: string | number; highlight?: boolean; accent?: boolean }) {
  return (
    <div className={cn("card p-4", highlight && "ring-1 ring-primary-200", accent && "ring-1 ring-amber-300 bg-amber-50")}>
      <p className="text-xs text-surface-500">{label}</p>
      <p className={cn("text-lg font-bold", highlight ? "text-primary-600" : accent ? "text-amber-700" : "text-surface-800")}>{value}</p>
    </div>
  );
}
