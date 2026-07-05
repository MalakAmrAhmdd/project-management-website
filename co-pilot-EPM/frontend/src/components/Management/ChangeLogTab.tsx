"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { History } from "lucide-react";

export function ChangelogTab({ selectedMilestones }: { selectedMilestones: number[] }) {
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