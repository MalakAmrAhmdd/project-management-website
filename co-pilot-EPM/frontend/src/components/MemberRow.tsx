// src/components/MemberRow.tsx
"use client";

import { cn, getAllocationColor } from "@/lib/utils";
import { Member, Team } from "@/types";
import { MemberAllocations } from "@/components/MemberAllocations";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

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
  const StatusIcon =
    alloc > 1
      ? AlertTriangle
      : alloc === 1
        ? CheckCircle2
        : alloc > 0
          ? AlertCircle
          : null;

  const colCount =
    [
      "name",
      "email",
      "role",
      "team",
      "allocation",
      "velocity",
      "actions",
    ].filter(isVisible).length + 1;

  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState(member.name);
  const [localEmail, setLocalEmail] = useState(member.email);
  const [localRole, setLocalRole] = useState(member.role);
  const [localTeamId, setLocalTeamId] = useState<number | null>(
    member.team_id ?? null,
  );

  useEffect(() => setLocalName(member.name), [member.name]);
  useEffect(() => setLocalEmail(member.email), [member.email]);
  useEffect(() => setLocalRole(member.role), [member.role]);
  useEffect(() => setLocalTeamId(member.team_id ?? null), [member.team_id]);

  return (
    <>
      <tr className="border-b border-surface-100 hover:bg-surface-50 group">
        <td className="px-3 py-1">
          <button
            onClick={onToggle}
            className="text-surface-400 hover:text-surface-600 mr-2"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>
        {isVisible("name") && (
          <td className="px-3 py-1">
            {!editing ? (
              <div className="font-medium">{member.name}</div>
            ) : (
              <input
                className="input"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
              />
            )}
          </td>
        )}
        {isVisible("email") && (
          <td className="px-3 py-1">
            {!editing ? (
              <div className="text-surface-600">{member.email}</div>
            ) : (
              <input
                className="input"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
              />
            )}
          </td>
        )}
        {isVisible("role") && (
          <td className="px-3 py-1">
            {!editing ? (
              <div className="text-surface-600">{member.role}</div>
            ) : (
              <input
                className="input"
                value={localRole}
                onChange={(e) => setLocalRole(e.target.value)}
              />
            )}
          </td>
        )}
        {/* only renders on resources page where teams array is provided */}
        {isVisible("team") && teams.length > 0 && (
          <td className="px-3 py-1">
            {!editing ? (
              <div className="text-surface-600">
                {teams.find((t) => t.id === member.team_id)?.name || ""}
              </div>
            ) : (
              <select
                value={localTeamId ?? ""}
                onChange={(e) =>
                  setLocalTeamId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-2 py-1 text-sm border border-surface-200 rounded bg-white
                           focus:outline-none focus:ring-1 focus:ring-primary-400
                           hover:border-primary-300 transition-colors"
              >
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
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
            <div className="flex items-center justify-center gap-2">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-surface-500 hover:text-surface-700 p-1"
                    title="Edit member"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      if (!localName.trim() || !localEmail.trim()) return;
                      if (
                        confirm(
                          "Are you sure you want to save changes to this member?",
                        )
                      ) {
                        const data: Partial<Member> = {
                          name: localName.trim(),
                          email: localEmail.trim(),
                          role: localRole,
                        };
                        if (localTeamId != null) data.team_id = localTeamId;
                        onUpdate(data);
                        setEditing(false);
                      }
                    }}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setLocalName(member.name);
                      setLocalEmail(member.email);
                      setLocalRole(member.role);
                      setLocalTeamId(member.team_id ?? null);
                      setEditing(false);
                    }}
                    className="text-surface-500 hover:text-surface-700 p-1"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
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
