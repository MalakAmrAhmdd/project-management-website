import type { ColumnDef } from "@/components/ColumnToggle";

export const RESOURCE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "team", label: "Team" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "actions", label: "Actions" },
];