"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getAllocationColor, getAllocationStatus } from "@/lib/utils";
import { Member, Team, Allocation } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ColumnToggle";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Search,
  AlertTriangle, CheckCircle2, AlertCircle, Save, X,
} from "lucide-react";
import toast from "react-hot-toast";

const RESOURCE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "team", label: "Team" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "actions", label: "Actions" },
];

export default function ResourcesPage() {
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => api.listMembers() });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: api.listTeams });
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const { visible, toggle, isVisible } = useColumnVisibility(RESOURCE_COLUMNS);

  const createMember = useMutation({
    mutationFn: api.createMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Member created"); setAddingRow(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Member>) => api.updateMember(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Member deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = members.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTeam && m.team_id !== filterTeam) return false;
    if (filterStatus) {
      const status = getAllocationStatus(m.allocation_percentage);
      if (filterStatus !== status) return false;
    }
    return true;
  });

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

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
                  onSave={(data) => createMember.mutate(data)}
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

function MemberRow({
  member,
  teamName,
  teams,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  isVisible,
}: {
  member: Member;
  teamName: string;
  teams: Team[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (data: Partial<Member>) => void;
  onDelete: () => void;
  isVisible: (key: string) => boolean;
}) {
  const alloc = member.allocation_percentage;
  const StatusIcon = alloc > 1 ? AlertTriangle : alloc === 1 ? CheckCircle2 : alloc > 0 ? AlertCircle : null;
  const colCount = ["name", "email", "role", "team", "allocation", "velocity", "actions"].filter(isVisible).length + 1;

  return (
    <>
      <tr className="border-b border-surface-100 hover:bg-surface-50 group">
        <td className="px-3 py-1">
          <button onClick={onToggle} className="text-surface-400 hover:text-surface-600">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
        {isVisible("team") && (
          <td className="px-3 py-1">
            <select
              value={member.team_id}
              onChange={(e) => onUpdate({ team_id: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-surface-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 hover:border-primary-300 transition-colors"
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
          <td className="px-3 py-1 text-right font-mono">{member.overall_avg_velocity.toFixed(1)}</td>
        )}
        {isVisible("actions") && (
          <td className="px-3 py-1 text-center">
            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1">
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

function NewMemberRow({
  teams,
  onSave,
  onCancel,
  isVisible,
}: {
  teams: Team[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isVisible: (key: string) => boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Engineer");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? 1);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <tr className="border-b border-surface-100 bg-primary-50">
      <td className="px-3 py-2"></td>
      {isVisible("name") && (
        <td className="px-3 py-2">
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input py-1 px-2 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && name && email) onSave({ name, email, role, team_id: teamId }); if (e.key === "Escape") onCancel(); }} />
        </td>
      )}
      {isVisible("email") && (
        <td className="px-3 py-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input py-1 px-2 text-sm" />
        </td>
      )}
      {isVisible("role") && (
        <td className="px-3 py-2">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="input py-1 px-2 text-sm" />
        </td>
      )}
      {isVisible("team") && (
        <td className="px-3 py-2">
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))} className="input py-1 px-2 text-sm w-36">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
      )}
      {isVisible("allocation") && <td></td>}
      {isVisible("velocity") && <td></td>}
      {isVisible("actions") && (
        <td className="px-3 py-2 text-center space-x-2">
          <button
            onClick={() => { if (name && email) onSave({ name, email, role, team_id: teamId }); }}
            className="btn-primary text-xs py-1 px-3"
          >Save</button>
          <button onClick={onCancel} className="btn-secondary text-xs py-1 px-3">Cancel</button>
        </td>
      )}
    </tr>
  );
}

/* ── Editable Allocation Panel for a Member ── */
function MemberAllocations({ memberId }: { memberId: number }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newMsId, setNewMsId] = useState<number | "">("");
  const [newVelocity, setNewVelocity] = useState("8");
  const [newContrib, setNewContrib] = useState("1.0");

  const { data: contributions } = useQuery({
    queryKey: ["member-contributions", memberId],
    queryFn: () => api.getMemberContributions(memberId),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["project-timeline"],
    queryFn: api.projectTimeline,
  });

  // Build flat list of milestones from timeline for the "add" dropdown
  const allMilestones: { id: number; name: string; projectName: string }[] = [];
  timeline.forEach((proj) => {
    proj.phases.forEach((phase) => {
      phase.milestones.forEach((ms) => {
        allMilestones.push({ id: ms.id, name: ms.name, projectName: proj.name });
      });
    });
  });

  const allocatedMsIds = new Set(
    (contributions?.contributions || []).map((c: any) => c.milestone_id)
  );

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["member-contributions", memberId] });
    qc.invalidateQueries({ queryKey: ["members"] });
  };

  const createAlloc = useMutation({
    mutationFn: api.createAllocation,
    onSuccess: () => { invalidateAll(); toast.success("Allocation added"); setAdding(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAlloc = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Allocation>) => api.updateAllocation(id, data),
    onSuccess: () => { invalidateAll(); toast.success("Allocation updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAlloc = useMutation({
    mutationFn: api.deleteAllocation,
    onSuccess: () => { invalidateAll(); toast.success("Allocation removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const contribs = contributions?.contributions || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-surface-700">Allocations</h4>
        <button onClick={() => setAdding(true)} className="btn-primary text-xs py-1 px-2">
          <Plus className="w-3 h-3" /> Add Allocation
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-surface-500">Project</th>
            <th className="text-left py-2 px-2 font-medium text-surface-500">Milestone</th>
            <th className="text-left py-2 px-2 font-medium text-surface-500">State</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Velocity (100%)</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Contribution %</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Effective Velocity</th>
            <th className="text-right py-2 px-2 font-medium text-surface-500">Avg FTO</th>
            <th className="text-center py-2 px-2 font-medium text-surface-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {adding && (
            <tr className="border-b border-surface-100 bg-primary-50">
              <td colSpan={2} className="py-2 px-2">
                <select
                  value={newMsId}
                  onChange={(e) => setNewMsId(e.target.value ? Number(e.target.value) : "")}
                  className="input py-1 px-2 text-xs w-full"
                >
                  <option value="">Select milestone...</option>
                  {allMilestones
                    .filter((ms) => !allocatedMsIds.has(ms.id))
                    .map((ms) => (
                      <option key={ms.id} value={ms.id}>{ms.projectName} — {ms.name}</option>
                    ))}
                </select>
              </td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2">
                <input value={newVelocity} onChange={(e) => setNewVelocity(e.target.value)}
                  className="input py-1 px-1 text-xs w-16 text-right" type="number" step="0.5" />
              </td>
              <td className="py-2 px-2">
                <input value={newContrib} onChange={(e) => setNewContrib(e.target.value)}
                  className="input py-1 px-1 text-xs w-16 text-right" type="number" step="0.1" min="0" max="1" />
              </td>
              <td className="py-2 px-2 text-right font-mono text-surface-400">
                {(Number(newVelocity) * Number(newContrib)).toFixed(1)}
              </td>
              <td></td>
              <td className="py-2 px-2 text-center space-x-1">
                <button
                  onClick={() => {
                    if (newMsId) {
                      createAlloc.mutate({
                        member_id: memberId,
                        milestone_id: Number(newMsId),
                        velocity_if_100_pct: Number(newVelocity),
                        contribution_percentage: Number(newContrib),
                      });
                    }
                  }}
                  className="btn-primary text-xs py-0.5 px-2"
                >Add</button>
                <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-0.5 px-2">Cancel</button>
              </td>
            </tr>
          )}
          {contribs.map((c: any) => (
            <AllocationEditRow
              key={c.allocation_id}
              contribution={c}
              onUpdate={(data) => updateAlloc.mutate({ id: c.allocation_id, ...data })}
              onDelete={() => {
                if (confirm(`Remove allocation to ${c.milestone_name}?`))
                  deleteAlloc.mutate(c.allocation_id);
              }}
            />
          ))}
          {contribs.length === 0 && !adding && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-surface-400 text-xs">
                No allocations. Click "Add Allocation" to assign to a milestone.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AllocationEditRow({ contribution, onUpdate, onDelete }: {
  contribution: any;
  onUpdate: (data: Partial<Allocation>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-surface-100 hover:bg-white group">
      <td className="py-2 px-2">{contribution.project_name}</td>
      <td className="py-2 px-2 font-medium">{contribution.milestone_name}</td>
      <td className="py-2 px-2">
        <span className={cn("badge text-xs",
          contribution.milestone_state === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
        )}>{contribution.milestone_state}</span>
      </td>
      <td className="py-2 px-2 text-right">
        <InlineInput
          value={String(contribution.velocity_if_100_pct)}
          onSave={(v) => onUpdate({ velocity_if_100_pct: Number(v) })}
          type="number"
          align="right"
          className="font-mono w-16"
        />
      </td>
      <td className="py-2 px-2 text-right">
        <InlineInput
          value={String((contribution.contribution_percentage * 100).toFixed(0))}
          onSave={(v) => onUpdate({ contribution_percentage: Number(v) / 100 })}
          type="number"
          align="right"
          className="font-mono w-16"
        />
      </td>
      <td className="py-2 px-2 text-right font-mono">{contribution.effective_velocity.toFixed(1)}</td>
      <td className="py-2 px-2 text-right font-mono">{contribution.average_fto}</td>
      <td className="py-2 px-2 text-center">
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
          <Trash2 className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
