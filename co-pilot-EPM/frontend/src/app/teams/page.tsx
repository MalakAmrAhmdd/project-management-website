"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Team } from "@/types";
import { InlineInput } from "@/components/InlineInput";
import {
  Plus, Trash2, Users, ChevronRight, FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function TeamsPage() {
  const qc = useQueryClient();
  const { data: teams = [], isLoading } = useQuery({ queryKey: ["teams"], queryFn: api.listTeams });
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => api.listMembers() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const [addingTeam, setAddingTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const createTeam = useMutation({
    mutationFn: api.createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created");
      setAddingTeam(false);
      setNewName("");
      setNewDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Team>) => api.updateTeam(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); toast.success("Team updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTeam = useMutation({
    mutationFn: api.deleteTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); toast.success("Team deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const memberCountByTeam = (teamId: number) => members.filter((m) => m.team_id === teamId).length;
  const projectCountByTeam = (teamId: number) => projects.filter((p) => p.team_id === teamId).length;

   if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        Loading teams now please wait ....
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Teams</h1>
          <p className="text-surface-500 text-sm mt-1">Manage teams and their members</p>
        </div>
        <button onClick={() => setAddingTeam(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="text-left px-4 py-3 font-semibold text-surface-600 w-[280px]">Team Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Description</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600 w-28">Members</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600 w-28">Projects</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addingTeam && (
                <tr className="border-b bg-primary-50">
                  <td className="px-4 py-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Team name"
                      className="input py-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newName.trim()) createTeam.mutate({ name: newName, description: newDesc });
                        if (e.key === "Escape") setAddingTeam(false);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Description"
                      className="input py-1 text-sm"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => { if (newName.trim()) createTeam.mutate({ name: newName, description: newDesc }); }}
                      className="btn-primary text-xs py-1 px-3"
                    >Save</button>
                    <button onClick={() => setAddingTeam(false)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                  </td>
                </tr>
              )}
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-surface-100 hover:bg-surface-50 group">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <InlineInput
                        value={team.name}
                        onSave={(v) => updateTeam.mutate({ id: team.id, name: v })}
                        className="font-semibold"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <InlineInput
                      value={team.description}
                      onSave={(v) => updateTeam.mutate({ id: team.id, description: v })}
                      placeholder="No description"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="badge bg-blue-50 text-blue-700">
                      <Users className="w-3 h-3 mr-1" />
                      {memberCountByTeam(team.id)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="badge bg-purple-50 text-purple-700">
                      <FolderKanban className="w-3 h-3 mr-1" />
                      {projectCountByTeam(team.id)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/teams/${team.id}`}
                        className="text-primary-600 hover:text-primary-700 p-1"
                        title="View team"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => { if (confirm(`Delete team "${team.name}"?`)) deleteTeam.mutate(team.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
                        title="Delete team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && !addingTeam && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-surface-400">
                    No teams yet. Create one to get started.
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
