"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity, incrementName } from "@/lib/utils";
import { TODAY, STATES, HIERARCHY_COLUMNS, canActivate } from "@/lib/projectDetails";

import { Project, ProjectFull, ItemState, Phase, Milestone, Epic, Story, Allocation, Member } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ColumnToggle, useColumnVisibility } from "@/components/ColumnToggle";
import { StatCard } from "@/components/Shared/StatCard";
import { StoryRow } from "@/components/Projects/StoryRow";
import { EpicRow } from "@/components/Projects/EpicRow";
import { AllocationPanel } from "@/components/Projects/AllocationPanel";
import { MilestoneRow } from "@/components/Projects/MilestoneRow";
import { PhaseRow } from "@/components/Projects/PhaseRow";

import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";


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