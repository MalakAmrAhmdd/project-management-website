"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import { ProjectFull, ItemState, Milestone, Member } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown, Target, Users } from "lucide-react";
import toast from "react-hot-toast";
import { TODAY, STATES, canActivate } from "@/lib/projectDetails";
import { EpicRow } from "./EpicRow";
import { AllocationPanel } from "./AllocationPanel";

interface MilestoneRowProps {
  milestone: ProjectFull["phases"][number]["milestones"][number];
  msIndex: number;
  totalMs: number;
  onAddEpic: () => void;
  onAddStory: (epicId: number) => void;
  projectId: number;
  isVisible: (key: string) => boolean;
  members: Member[];
  onActivated: () => void;
}

export function MilestoneRow({ milestone: ms, msIndex, totalMs, onAddEpic, onAddStory, projectId, isVisible, members, onActivated }: MilestoneRowProps) {
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