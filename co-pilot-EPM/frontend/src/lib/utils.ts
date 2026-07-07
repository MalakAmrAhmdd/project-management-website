import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TimelineProject } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAllocationStatus(
  pct: number,
): "over" | "optimal" | "under" | "unallocated" {
  if (pct === 0) return "unallocated";
  if (pct > 1.0) return "over";
  if (pct === 1.0) return "optimal";
  return "under";
}

/** Increment trailing number in a name, e.g. "Phase 1" -> "Phase 2" */
export function incrementName(name: string): string {
  const m = name.match(/^(.*?)(\d+)$/);
  if (m) return `${m[1]}${Number(m[2]) + 1}`;
  return `${name} 2`;
}

export function getAllocationColor(pct: number): string {
  const status = getAllocationStatus(pct);
  switch (status) {
    case "over":
      return "text-red-600 bg-red-50";
    case "optimal":
      return "text-green-600 bg-green-50";
    case "under":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-400 bg-gray-50";
  }
}

export function getStateColor(state: string): string {
  switch (state) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "ON_HOLD":
      return "bg-orange-100 text-orange-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function computeDuration(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e.getTime() - s.getTime();
  if (diffMs < 0) return "—";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}d`;
  const weeks = Math.round((days / 7) * 10) / 10;
  if (weeks < 4.5) return `${weeks}w`;
  const months = Math.round((days / 30.44) * 10) / 10;
  return `${months}mo`;
}

export function computeOverallVelocity(
  totalPoints: number,
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end || !totalPoints) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const weeks = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 7);
  if (weeks <= 0) return "—";
  return `${(totalPoints / weeks).toFixed(1)} pts/wk`;
}

export function flattenMilestones(timeline: TimelineProject[]) {
  const result: {
    id: number;
    name: string;
    projectName: string;
    phaseName: string;
    state: string;
  }[] = [];
  timeline.forEach((proj) => {
    proj.phases.forEach((phase) => {
      phase.milestones.forEach((ms) => {
        result.push({
          id: ms.id,
          name: ms.name,
          projectName: proj.name,
          phaseName: phase.name,
          state: ms.state,
        });
      });
    });
  });
  return result;
}
