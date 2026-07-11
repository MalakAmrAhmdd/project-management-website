// src/components/MemberRow.tsx
"use client";

import { cn, getAllocationColor } from "@/lib/utils";
import { Member, Team } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { MemberAllocations } from "@/components/MemberAllocations";
import {
  ChevronDown, ChevronRight, Trash2,
  AlertTriangle, CheckCircle2, AlertCircle,
} from "lucide-react";

export function MemberRow({
  member,
  teamName,
  teams = [],    
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  isVisible,
}: {
  member: Member;
  teamName?: string;  
  teams?: Team[];      
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (data: Partial<Member>) => void;
  onDelete: () => void;
  isVisible: (key: string) => boolean;
}) {
  const alloc = member.allocation_percentage;
  const StatusIcon = alloc > 1
    ? AlertTriangle
    : alloc === 1
      ? CheckCircle2
      : alloc > 0
        ? AlertCircle
        : null;

  const colCount = ["name", "email", "role", "team", "allocation", "velocity", "actions"]
    .filter(isVisible).length + 1;

  return (
    <>
      <tr className="border-b border-surface-100 hover:bg-surface-50 group">
        <td className="px-3 py-1">
          <button onClick={onToggle} className="text-surface-400 hover:text-surface-600">
            {isExpanded
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        {isVisible("name") && (
          <td className="px-3 py-1">
            <InlineInput value={member.name} onSave={(v) => onUpdate({ name: v })} className="font-medium" />
          </td>
        )}
        {isVisible("email") && (
          <td className="px-3 py-1">
            <InlineInput value={member.email} onSave={(v) => onUpdate({ email: v })} />
          </td>
        )}
        {isVisible("role") && (
          <td className="px-3 py-1">
            <InlineInput value={member.role} onSave={(v) => onUpdate({ role: v })} />
          </td>
        )}
        {/* only renders on resources page where teams array is provided */}
        {isVisible("team") && teams.length > 0 && (
          <td className="px-3 py-1">
            <select
              value={member.team_id}
              onChange={(e) => onUpdate({ team_id: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-surface-200 rounded bg-white
                         focus:outline-none focus:ring-1 focus:ring-primary-400
                         hover:border-primary-300 transition-colors"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </td>
        )}
        {isVisible("allocation") && (
          <td className="px-3 py-1 text-right">
            <span className={cn("badge gap-1", getAllocationColor(alloc))}>
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {(alloc * 100).toFixed(0)}%
            </span>
          </td>
        )}
        {isVisible("velocity") && (
          <td className="px-3 py-1 text-right font-mono">
            {member.overall_avg_velocity.toFixed(1)}
          </td>
        )}
        {isVisible("actions") && (
          <td className="px-3 py-1 text-center">
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={colCount} className="bg-surface-50 px-8 py-4">
            <MemberAllocations memberId={member.id} />
          </td>
        </tr>
      )}
    </>
  );
}
