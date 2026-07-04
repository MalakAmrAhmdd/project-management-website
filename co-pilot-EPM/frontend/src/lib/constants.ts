import type { ColumnDef } from "@/components/ColumnToggle";
import { Target, BarChart3, History } from "lucide-react";

export const RESOURCE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "team", label: "Team" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "actions", label: "Actions" },
];


export const MANAGEMENT_TABS = [
  { key: "milestone" as const, label: "Milestone Details", icon: Target },
  { key: "timeline" as const, label: "Project Timeline", icon: BarChart3 },
  { key: "changelog" as const, label: "Change History", icon: History },
] as const;

export const PIE_COLORS = ["#ef4444", "#22c55e", "#eab308", "#94a3b8"];
