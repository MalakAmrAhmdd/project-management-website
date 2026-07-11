import type { ColumnDef } from "@/components/ColumnToggle";
import { Target, BarChart3, History } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ItemState } from "@/types";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Users2,
  Settings2
} from "lucide-react";


export const RESOURCE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "team", label: "Team" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "actions", label: "Actions" },
  { key: "contributions", label: "Contributions", defaultVisible: false },
];

export const MANAGEMENT_TABS = [
  { key: "milestone" as const, label: "Milestone Details", icon: Target },
  { key: "timeline" as const, label: "Project Timeline", icon: BarChart3 },
  { key: "changelog" as const, label: "Change History", icon: History },
] as const;

export const PIE_COLORS = ["#ef4444", "#22c55e", "#eab308", "#94a3b8"];

export const TEAM_MEMBER_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "contributions", label: "Contributions", defaultVisible: false },
  { key: "actions", label: "Actions" },
];

/** Today's date as YYYY-MM-DD string */
export const TODAY = new Date().toISOString().split("T")[0];

export const STATES: ItemState[] = [
  "NOT_STARTED",
  "ACTIVE",
  "ON_HOLD",
  "PENDING",
  "COMPLETED",
];

export const HIERARCHY_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "state", label: "State" },
  { key: "points", label: "Est. Points" },
  { key: "resources", label: "Resources" },
  { key: "start", label: "Start Date" },
  { key: "end", label: "Original End" },
  { key: "adaptive", label: "Adaptive End" },
  { key: "duration", label: "Duration" },
  { key: "velocity", label: "Velocity", defaultVisible: false },
  { key: "actions", label: "Actions" },
];

export const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/resources", label: "Resources", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/management", label: "Management", icon: Settings2 },
];

/**
 * Returns null if the state change to ACTIVE is permitted,
 * or error string if it should be blocked.
 */
export function canActivate(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string | null {
  if (startDate && startDate > TODAY)
    return `Start date (${formatDate(startDate)}) is after today (${formatDate(TODAY)})`;
  if (endDate && endDate < TODAY)
    return `End date (${formatDate(endDate)}) is already in the past (today is ${formatDate(TODAY)})`;
  return null;
}
