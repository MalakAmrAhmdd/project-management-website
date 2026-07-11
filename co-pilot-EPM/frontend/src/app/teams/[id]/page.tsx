"use client";

import { NewMemberRow } from "@/components/NewMemberRow";
import { MemberRow } from "@/components/MemberRow";
import { ColumnToggle, useColumnVisibility } from "@/components/ColumnToggle";
import { TEAM_MEMBER_COLUMNS } from "@/lib/constants";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { TeamCard } from "@/components/Shared/TeamCard";
import { useTeamDetailData } from "@/hooks/useTeamDetailData";

export default function TeamDetailPage() {
  const { id } = useParams();
  const teamId = Number(id);

  const [addingMember, setAddingMember] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { visible, toggle, isVisible } =
    useColumnVisibility(TEAM_MEMBER_COLUMNS);

  const {
    team,
    isLoading,
    teamProjects,
    updateTeam,
    createMember,
    updateMember,
    deleteMember,
  } = useTeamDetailData(teamId);

  if (isLoading)
    return <div className="text-center py-12 text-surface-400">Loading...</div>;
  if (!team)
    return (
      <div className="text-center py-12 text-surface-400">Team not found</div>
    );

  const members = team.members || [];

  return (
    <div className="space-y-6">
      <TeamCard
        name={team.name}
        description={team.description}
        membersCount={members.length}
        projectsCount={teamProjects.length}
        overAllocated={
          members.filter((m) => m.allocation_percentage > 1).length
        }
        avgVelocity={
          members.length > 0
            ? members.reduce((s, m) => s + m.overall_avg_velocity, 0) /
              members.length
            : null
        }
        onEditName={(v) => updateTeam.mutate({ name: v })}
        onEditDescription={(v) => updateTeam.mutate({ description: v })}
        showActions={false}
      />
      {/* Team Projects */}
      {teamProjects.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-800 text-sm mb-3">
            Team Projects
          </h3>
          <div className="flex flex-wrap gap-2">
            {teamProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="badge bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <FolderKanban className="w-3 h-3 mr-1" />
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-b">
          <h2 className="font-semibold text-surface-800">Team Members</h2>
          <div className="flex items-center gap-2">
            <ColumnToggle
              columns={TEAM_MEMBER_COLUMNS}
              visible={visible}
              onToggle={toggle}
            />
            <button
              onClick={() => setAddingMember(true)}
              className="btn-primary text-xs py-1.5"
            >
              <Plus className="w-3 h-3" /> Add Member
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="w-8 px-3 py-3"></th>
                {isVisible("name") && (
                  <th className="text-left px-3 py-3 font-semibold text-surface-600">
                    Name
                  </th>
                )}
                {isVisible("email") && (
                  <th className="text-left px-3 py-3 font-semibold text-surface-600">
                    Email
                  </th>
                )}
                {isVisible("role") && (
                  <th className="text-left px-3 py-3 font-semibold text-surface-600">
                    Role
                  </th>
                )}
                {isVisible("allocation") && (
                  <th className="text-right px-3 py-3 font-semibold text-surface-600">
                    Allocation
                  </th>
                )}
                {isVisible("velocity") && (
                  <th className="text-right px-3 py-3 font-semibold text-surface-600">
                    Avg Velocity
                  </th>
                )}
                {isVisible("actions") && (
                  <th className="text-center px-3 py-3 font-semibold text-surface-600">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {addingMember && (
                <NewMemberRow
                  teamId={teamId} // ← passes fixed team ID
                  onSave={(data) =>
                    createMember.mutate(data, {
                      onSuccess: () => setAddingMember(false),
                    })
                  }
                  onCancel={() => setAddingMember(false)}
                  isVisible={isVisible} // ← correct prop name
                />
              )}
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isExpanded={expandedId === m.id}
                  onToggle={() =>
                    setExpandedId(expandedId === m.id ? null : m.id)
                  }
                  onUpdate={(data) =>
                    updateMember.mutate({ id: m.id, ...data })
                  }
                  onDelete={() => {
                    if (confirm(`Remove ${m.name}?`)) deleteMember.mutate(m.id);
                  }}
                  isVisible={isVisible}
                />
              ))}
              {members.length === 0 && !addingMember && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-surface-400"
                  >
                    No members in this team. Add one to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
