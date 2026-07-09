"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor } from "@/lib/utils";
import { Story } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface StoryRowProps {
  story: Story;
  projectId: number;
  isVisible: (key: string) => boolean;
}

export function StoryRow({ story, projectId, isVisible }: StoryRowProps) {
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