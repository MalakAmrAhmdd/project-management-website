import { formatDate } from "@/lib/utils";
import type { ItemState } from "@/types";
import { type ColumnDef } from "@/components/ColumnToggle";

/** Today's date as YYYY-MM-DD string */
export const TODAY = new Date().toISOString().split("T")[0];

export const STATES: ItemState[] = ["NOT_STARTED", "ACTIVE", "ON_HOLD", "PENDING", "COMPLETED"];

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

/**
 * Returns null if the state change to ACTIVE is permitted,
 * or error string if it should be blocked.
 */
export function canActivate(startDate: string | null | undefined, endDate: string | null | undefined): string | null {
  if (startDate && startDate > TODAY)
    return `Start date (${formatDate(startDate)}) is after today (${formatDate(TODAY)})`;
  if (endDate && endDate < TODAY)
    return `End date (${formatDate(endDate)}) is already in the past (today is ${formatDate(TODAY)})`;
  return null;
}