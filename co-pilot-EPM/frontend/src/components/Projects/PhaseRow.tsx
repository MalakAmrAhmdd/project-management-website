"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity, incrementName } from "@/lib/utils";
import { ProjectFull, ItemState, Phase, Milestone, Member } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { TODAY, STATES, canActivate } from "@/lib/projectDetails";
import { MilestoneRow } from "./MilestoneRow";

interface PhaseRowProps {
  phase: ProjectFull["phases"][number];
  phaseIndex: number;
  totalPhases: number;
  onAddMilestone: (data: Partial<Milestone> & { phase_id: number }) => void;
  onAddEpic: (msId: number) => void;
  onAddStory: (epicId: number) => void;
  projectId: number;
  isVisible: (key: string) => boolean;
  members: Member[];
  onMilestoneActivated: () => void;
}

export function PhaseRow({ phase, phaseIndex, totalPhases, onAddMilestone, onAddEpic, onAddStory, projectId, isVisible, members, onMilestoneActivated }: PhaseRowProps) {
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
    updatePhase.mutate({ id: phase.id, order_index: newIndex });
  };

  const startDate = phase.actual_start_date || phase.original_start_date;
  const endDate = phase.adaptive_end_date || phase.original_end_date;

  // Smart add milestone: inherit from last milestone in this phase
  const handleAddMilestone = () => {
    const milestones = phase.milestones;
    const last = milestones[milestones.length - 1];
    const newData: Partial<Milestone> & { phase_id: number } = { name: "New Milestone", phase_id: phase.id };
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
                const update: Partial<Phase> = { original_start_date: v, actual_start_date: v };
                if (phase.state === "ACTIVE" && v > TODAY) {
                  update.state = "NOT_STARTED";
                  toast("Phase deactivated: start date is now after today.");
                }
                updatePhase.mutate({ id: phase.id, ...update });
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
                updatePhase.mutate({ id: phase.id, original_end_date: v }, {
                  onSuccess: (data: Phase) => {
                    if (phase.state === "ACTIVE" && data.adaptive_end_date && data.adaptive_end_date < TODAY) {
                      updatePhase.mutate({ id: phase.id, state: "NOT_STARTED" });
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