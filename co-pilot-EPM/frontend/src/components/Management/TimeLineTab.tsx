"use client";

import { cn, formatDate } from "@/lib/utils";
import { TimelineProject } from "@/types";
import { Target, BarChart3 } from "lucide-react";

export function TimelineTab({ timeline, selectedProjectId }: {
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