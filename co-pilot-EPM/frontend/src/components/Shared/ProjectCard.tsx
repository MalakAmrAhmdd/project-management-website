"use client";

import Link from "next/link";
import { Target, Users, Calendar, Trash2, Clock, TrendingUp } from "lucide-react";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  teamName?: string;
  onDelete: (id: number) => void;
}

export function ProjectCard({ project: p, teamName, onDelete }: ProjectCardProps) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={cn("badge mb-2", getStateColor(p.state))}>{p.state}</span>
          <Link href={`/projects/${p.id}`} className="block font-semibold text-surface-800 hover:text-primary-600">
            {p.name}
          </Link>
          {p.description && (
            <p className="text-xs text-surface-500 mt-1 line-clamp-2">{p.description}</p>
          )}
        </div>
        <button
          onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p.id); }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-surface-500">
          <Target className="w-3.5 h-3.5" />
          <span>{p.total_estimated_points} pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-surface-500">
          <Users className="w-3.5 h-3.5" />
          <span>{p.num_allocated_resources} resources</span>
        </div>
        <div className="flex items-center gap-1.5 text-surface-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(p.original_start_date)} — {formatDate(p.adaptive_end_date || p.original_end_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-surface-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{computeDuration(p.original_start_date, p.adaptive_end_date || p.original_end_date)}</span>
        </div>
        <div className="col-span-2 flex items-center gap-1.5 text-surface-500">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Velocity: {computeOverallVelocity(p.total_estimated_points, p.original_start_date, p.adaptive_end_date || p.original_end_date)}</span>
        </div>
      </div>
      {p.team_id && (
        <div className="mt-3 text-xs text-surface-400">
          Team: {teamName || "—"}
        </div>
      )}
    </div>
  );
}
