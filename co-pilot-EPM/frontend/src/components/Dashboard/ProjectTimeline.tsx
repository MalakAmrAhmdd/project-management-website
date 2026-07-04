// src/components/ProjectTimeline.tsx
"use client";

import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import { TimelineProject } from "@/types";
import { Target } from "lucide-react";
import Link from "next/link";

export function ProjectTimeline({ timeline }: { timeline: TimelineProject[] | undefined }) {
  return (
    <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-800">Project Timeline</h2>
          <Link href="/management" className="text-primary-600 text-sm font-medium hover:underline">
            Manage →
          </Link>
        </div>
        <div className="space-y-4">
          {timeline?.map((proj) => (
            <div key={proj.id} className="border border-surface-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className={cn("badge", getStateColor(proj.state))}>{proj.state}</span>
                <Link href={`/projects/${proj.id}`} className="font-semibold text-surface-800 hover:text-primary-600">
                  {proj.name}
                </Link>
                <Link href={`/projects/${proj.id}`} className="text-primary-600 text-xs hover:underline ml-auto">
                  Edit →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 mb-3 text-xs text-surface-500">
                <span>{formatDate(proj.start_date)} — {formatDate(proj.end_date)}</span>
                <span className="text-surface-300">|</span>
                <span>Duration: {computeDuration(proj.start_date, proj.end_date)}</span>
              </div>
              <div className="space-y-2 pl-4">
                {proj.phases.map((phase) => (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn("w-2 h-2 rounded-full",
                        phase.state === "ACTIVE" ? "bg-blue-500" :
                        phase.state === "COMPLETED" ? "bg-green-500" : "bg-gray-300"
                      )} />
                      <span className={cn("font-medium", phase.is_placeholder && "text-surface-400 italic")}>
                        {phase.name}
                      </span>
                      <span className="text-xs text-surface-400">
                        {computeDuration(phase.start_date, phase.end_date)}
                      </span>
                      <span className="text-xs text-surface-400 ml-auto">
                        {formatDate(phase.start_date)} — {formatDate(phase.end_date)}
                      </span>
                    </div>
                    <div className="space-y-1 pl-4 mt-1">
                      {phase.milestones.map((ms) => (
                        <div key={ms.id} className={cn(
                          "flex items-center gap-2 text-xs",
                          ms.is_placeholder && "text-surface-400 italic"
                        )}>
                          <Target className="w-3 h-3 shrink-0" />
                          <Link href="/management" className="hover:text-primary-600">{ms.name}</Link>
                          <span className="text-surface-400">
                            {ms.total_estimated_points}pts · {ms.num_allocated_resources}res
                            · {computeDuration(ms.start_date, ms.end_date)}
                            · {computeOverallVelocity(ms.total_estimated_points, ms.start_date, ms.end_date)}
                          </span>
                          <span className="ml-auto text-surface-400">
                            {formatDate(ms.start_date)} — {formatDate(ms.end_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {timeline?.length === 0 && (
            <p className="text-center text-surface-400 py-8">No projects yet. Create one to get started.</p>
          )}
        </div>
      </div>
  );
}