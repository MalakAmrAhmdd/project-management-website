"use client";

import { useState} from "react";
import { ColumnToggle, useColumnVisibility } from "@/components/ColumnToggle";
import { Plus, Search } from "lucide-react";
import { RESOURCE_COLUMNS } from "@/lib/constants";
import { useResourcesData } from "@/hooks/useResourcesData";
import { NewMemberRow } from "@/components/NewMemberRow";
import { MemberRow } from "@/components/MemberRow";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const { visible, toggle, isVisible } = useColumnVisibility(RESOURCE_COLUMNS);

  const {
    teams,
    filtered,
    teamMap,
    isLoading,
    createMember,
    updateMember,
    deleteMember,
  } = useResourcesData(search, filterTeam, filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Resources</h1>
          <p className="text-surface-500 text-sm mt-1">Manage team members and their allocation across milestones</p>
        </div>
        <button onClick={() => setAddingRow(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterTeam ?? ""}
          onChange={(e) => setFilterTeam(e.target.value ? Number(e.target.value) : null)}
          className="input w-48"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filterStatus ?? ""}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="input w-48"
        >
          <option value="">All Statuses</option>
          <option value="over">Over-allocated</option>
          <option value="optimal">Optimal</option>
          <option value="under">Under-utilized</option>
          <option value="unallocated">Unallocated</option>
        </select>
        <ColumnToggle columns={RESOURCE_COLUMNS} visible={visible} onToggle={toggle} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="w-8 px-3 py-3"></th>
                {isVisible("name") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Name</th>}
                {isVisible("email") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Email</th>}
                {isVisible("role") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Role</th>}
                {isVisible("team") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Team</th>}
                {isVisible("allocation") && <th className="text-right px-3 py-3 font-semibold text-surface-600">Allocation</th>}
                {isVisible("velocity") && <th className="text-right px-3 py-3 font-semibold text-surface-600">Avg Velocity</th>}
                {isVisible("actions") && <th className="text-center px-3 py-3 font-semibold text-surface-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {addingRow && (
                <NewMemberRow
                  teams={teams}
                  onSave={(data) => {
                      // call mutate here, then handle UI state after
                      createMember.mutate(data, {
                        onSuccess: () => setAddingRow(false), // ← UI side effect stays here
                      });
                    }}
                  onCancel={() => setAddingRow(false)}
                  isVisible={isVisible}
                />
              )}
              {filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  teamName={teamMap[m.team_id] || "—"}
                  teams={teams}
                  isExpanded={expandedId === m.id}
                  onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  onUpdate={(data) => updateMember.mutate({ id: m.id, ...data })}
                  onDelete={() => {
                    if (confirm(`Delete ${m.name}?`)) deleteMember.mutate(m.id);
                  }}
                  isVisible={isVisible}
                />
              ))}
              {filtered.length === 0 && !addingRow && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-surface-400">
                    {isLoading ? "Loading..." : "No members found"}
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


