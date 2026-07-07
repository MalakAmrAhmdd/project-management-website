"use client";

import React from 'react';
import { MANAGEMENT_TABS } from '@/lib/constants';
import { useManagementData } from '@/hooks/useManagementData';
import { MilestonePanel } from '@/components/Management/MileStonePanel';
import { TimelineTab } from '@/components/Management/TimeLineTab';
import { ChangelogTab } from '@/components/Management/ChangeLogTab';
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Member } from "@/types";
import { Target } from "lucide-react";

export default function ManagementPage() {
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<number[]>([]);
  const [tab, setTab] = useState<"milestone" | "timeline" | "changelog">("milestone");

  const { projects, timeline, members, allMilestones } = useManagementData(selectedProjectId);


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
            {allMilestones.map((ms) => (
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
        {MANAGEMENT_TABS.map(({ key, label, icon: Icon }) => (
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

