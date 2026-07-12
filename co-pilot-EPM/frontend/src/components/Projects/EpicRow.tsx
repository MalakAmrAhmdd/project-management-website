"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import { ProjectFull, Epic } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ChevronDown, ChevronRight, Plus, BookOpen, Trash2 } from "lucide-react";
import { StoryRow } from "./StoryRow";
import { toast } from "react-hot-toast";

interface EpicRowProps {
  epic: ProjectFull["phases"][number]["milestones"][number]["epics"][number];
  onAddStory: () => void;
  projectId: number;
  isVisible: (key: string) => boolean;
}

export function EpicRow({ epic, onAddStory, projectId, isVisible }: EpicRowProps) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const updateEpic = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Epic>) => api.updateEpic(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const startDate = epic.actual_start_date || epic.original_start_date;
  const endDate = epic.adaptive_end_date || epic.original_end_date;

  const deleteEpic = useMutation({
    mutationFn: api.deleteEpic,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Epic deleted"); },
  });

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
            <button onClick={() => { if (confirm("Delete this epic?")) deleteEpic.mutate(epic.id); }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5">
              <Trash2 className="w-3 h-3" />
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