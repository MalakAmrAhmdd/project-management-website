"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getAllocationColor, getAllocationStatus, formatDate } from "@/lib/utils";
import { Member, Team, TeamWithMembers } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ColumnToggle";
import {
  Plus, Trash2, ArrowLeft, Users, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, AlertCircle, FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "allocation", label: "Allocation %" },
  { key: "velocity", label: "Avg Velocity" },
  { key: "contributions", label: "Contributions", defaultVisible: false },
  { key: "actions", label: "Actions" },
];

export default function TeamDetailPage() {
  const { id } = useParams();
  const teamId = Number(id);
  const qc = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api.getTeam(teamId),
  });

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const teamProjects = projects.filter((p) => p.team_id === teamId);

  const updateTeam = useMutation({
    mutationFn: (data: Partial<Team>) => api.updateTeam(teamId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team", teamId] }); toast.success("Team updated"); },
  });

  const createMember = useMutation({
    mutationFn: api.createMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", teamId] });
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added");
      setAddingMember(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: ({ id: mid, ...data }: { id: number } & Partial<Member>) => api.updateMember(mid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", teamId] });
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", teamId] });
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addingMember, setAddingMember] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { visible, toggle, isVisible } = useColumnVisibility(COLUMNS);

  if (isLoading) return <div className="text-center py-12 text-surface-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-surface-400">Team not found</div>;

  const members = team.members || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teams" className="text-surface-400 hover:text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <InlineInput
            value={team.name}
            onSave={(v) => updateTeam.mutate({ name: v })}
            className="text-2xl font-bold"
          />
          <InlineInput
            value={team.description || ""}
            onSave={(v) => updateTeam.mutate({ description: v })}
            placeholder="Add a description..."
            className="text-surface-500 text-sm mt-1"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-surface-500">Members</p>
          <p className="text-lg font-bold text-surface-800">{members.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-surface-500">Projects</p>
          <p className="text-lg font-bold text-surface-800">{teamProjects.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-surface-500">Over-Allocated</p>
          <p className="text-lg font-bold text-red-600">
            {members.filter((m) => m.allocation_percentage > 1).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-surface-500">Avg Velocity</p>
          <p className="text-lg font-bold text-surface-800">
            {members.length > 0
              ? (members.reduce((s, m) => s + m.overall_avg_velocity, 0) / members.length).toFixed(1)
              : "—"
            } pts/wk
          </p>
        </div>
      </div>

      {/* Team Projects */}
      {teamProjects.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-800 text-sm mb-3">Team Projects</h3>
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
            <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
            <button onClick={() => setAddingMember(true)} className="btn-primary text-xs py-1.5">
              <Plus className="w-3 h-3" /> Add Member
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="w-8 px-3 py-3"></th>
                {isVisible("name") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Name</th>}
                {isVisible("email") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Email</th>}
                {isVisible("role") && <th className="text-left px-3 py-3 font-semibold text-surface-600">Role</th>}
                {isVisible("allocation") && <th className="text-right px-3 py-3 font-semibold text-surface-600">Allocation</th>}
                {isVisible("velocity") && <th className="text-right px-3 py-3 font-semibold text-surface-600">Avg Velocity</th>}
                {isVisible("actions") && <th className="text-center px-3 py-3 font-semibold text-surface-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {addingMember && (
                <NewMemberRow
                  teamId={teamId}
                  onSave={(data) => createMember.mutate(data)}
                  onCancel={() => setAddingMember(false)}
                  visibleCols={isVisible}
                />
              )}
              {members.map((m) => (
                <TeamMemberRow
                  key={m.id}
                  member={m}
                  isExpanded={expandedId === m.id}
                  onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  onUpdate={(data) => updateMember.mutate({ id: m.id, ...data })}
                  onDelete={() => { if (confirm(`Remove ${m.name}?`)) deleteMember.mutate(m.id); }}
                  isVisible={isVisible}
                />
              ))}
              {members.length === 0 && !addingMember && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-surface-400">
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

function TeamMemberRow({
  member, isExpanded, onToggle, onUpdate, onDelete, isVisible,
}: {
  member: Member;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (data: Partial<Member>) => void;
  onDelete: () => void;
  isVisible: (key: string) => boolean;
}) {
  const { data: contribs } = useQuery({
    queryKey: ["member-contributions", member.id],
    queryFn: () => api.getMemberContributions(member.id),
    enabled: isExpanded,
  });

  const alloc = member.allocation_percentage;
  const StatusIcon = alloc > 1 ? AlertTriangle : alloc === 1 ? CheckCircle2 : alloc > 0 ? AlertCircle : null;
  const colCount = ["name", "email", "role", "allocation", "velocity", "actions"].filter(isVisible).length + 1;

  return (
    <>
      <tr className="border-b border-surface-100 hover:bg-surface-50 group">
        <td className="px-3 py-2">
          <button onClick={onToggle} className="text-surface-400 hover:text-surface-600">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        {isVisible("name") && (
          <td className="px-3 py-2">
            <InlineInput value={member.name} onSave={(v) => onUpdate({ name: v })} className="font-medium" />
          </td>
        )}
        {isVisible("email") && (
          <td className="px-3 py-2">
            <InlineInput value={member.email} onSave={(v) => onUpdate({ email: v })} />
          </td>
        )}
        {isVisible("role") && (
          <td className="px-3 py-2">
            <InlineInput value={member.role} onSave={(v) => onUpdate({ role: v })} />
          </td>
        )}
        {isVisible("allocation") && (
          <td className="px-3 py-2 text-right">
            <span className={cn("badge gap-1", getAllocationColor(alloc))}>
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {(alloc * 100).toFixed(0)}%
            </span>
          </td>
        )}
        {isVisible("velocity") && (
          <td className="px-3 py-2 text-right font-mono">{member.overall_avg_velocity.toFixed(1)}</td>
        )}
        {isVisible("actions") && (
          <td className="px-3 py-2 text-center">
            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={colCount} className="bg-surface-50 px-8 py-4">
            <h4 className="font-semibold text-sm text-surface-700 mb-2">Contribution Matrix</h4>
            {contribs?.contributions?.length ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-surface-500">Project</th>
                    <th className="text-left py-2 px-2 font-medium text-surface-500">Milestone</th>
                    <th className="text-right py-2 px-2 font-medium text-surface-500">Velocity (100%)</th>
                    <th className="text-right py-2 px-2 font-medium text-surface-500">Contribution %</th>
                    <th className="text-right py-2 px-2 font-medium text-surface-500">Effective Velocity</th>
                    <th className="text-right py-2 px-2 font-medium text-surface-500">Avg FTO</th>
                  </tr>
                </thead>
                <tbody>
                  {contribs.contributions.map((c: any) => (
                    <tr key={c.allocation_id} className="border-b border-surface-100">
                      <td className="py-2 px-2">{c.project_name}</td>
                      <td className="py-2 px-2 font-medium">{c.milestone_name}</td>
                      <td className="py-2 px-2 text-right font-mono">{c.velocity_if_100_pct}</td>
                      <td className="py-2 px-2 text-right font-mono">{(c.contribution_percentage * 100).toFixed(0)}%</td>
                      <td className="py-2 px-2 text-right font-mono">{c.effective_velocity.toFixed(1)}</td>
                      <td className="py-2 px-2 text-right font-mono">{c.average_fto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-surface-400 text-xs">No active allocations for this member</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function NewMemberRow({
  teamId, onSave, onCancel, visibleCols,
}: {
  teamId: number;
  onSave: (data: any) => void;
  onCancel: () => void;
  visibleCols: (key: string) => boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Engineer");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <tr className="border-b border-surface-100 bg-primary-50">
      <td className="px-3 py-2"></td>
      {visibleCols("name") && (
        <td className="px-3 py-2">
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input py-1 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && name && email) onSave({ name, email, role, team_id: teamId }); if (e.key === "Escape") onCancel(); }} />
        </td>
      )}
      {visibleCols("email") && (
        <td className="px-3 py-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input py-1 text-sm" />
        </td>
      )}
      {visibleCols("role") && (
        <td className="px-3 py-2">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="input py-1 text-sm" />
        </td>
      )}
      {visibleCols("allocation") && <td></td>}
      {visibleCols("velocity") && <td></td>}
      {visibleCols("actions") && (
        <td className="px-3 py-2 text-center space-x-2">
          <button onClick={() => { if (name && email) onSave({ name, email, role, team_id: teamId }); }}
            className="btn-primary text-xs py-1 px-3">Save</button>
          <button onClick={onCancel} className="btn-secondary text-xs py-1 px-3">Cancel</button>
        </td>
      )}
    </tr>
  );
}
