"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import { Project, Team } from "@/types";
import { Plus, FolderKanban, Target, Users, Calendar, Trash2, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: api.listTeams });
  const [showCreate, setShowCreate] = useState(false);

  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project created with placeholder hierarchy"); setShowCreate(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProject = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Projects</h1>
          <p className="text-surface-500 text-sm mt-1">Manage engineering projects and their full hierarchy</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreate && (
        <CreateProjectForm
          teams={teams}
          onSave={(data) => createProject.mutate(data)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={cn("badge mb-2", getStateColor(p.state))}>{p.state}</span>
                <Link href={`/projects/${p.id}`} className="block font-semibold text-surface-800 hover:text-primary-600">
                  {p.name}
                </Link>
                {p.description && (
                  <p className="text-xs text-surface-500 mt-1 line-clamp-2">{p.description}</p>
                )}
              </div>
              <button
                onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProject.mutate(p.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-surface-500">
                <Target className="w-3.5 h-3.5" />
                <span>{p.total_estimated_points} pts</span>
              </div>
              <div className="flex items-center gap-1.5 text-surface-500">
                <Users className="w-3.5 h-3.5" />
                <span>{p.num_allocated_resources} resources</span>
              </div>
              <div className="flex items-center gap-1.5 text-surface-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(p.original_start_date)} — {formatDate(p.adaptive_end_date || p.original_end_date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-surface-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{computeDuration(p.original_start_date, p.adaptive_end_date || p.original_end_date)}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-surface-500">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Velocity: {computeOverallVelocity(p.total_estimated_points, p.original_start_date, p.adaptive_end_date || p.original_end_date)}</span>
              </div>
            </div>
            {p.team_id && (
              <div className="mt-3 text-xs text-surface-400">
                Team: {teamMap[p.team_id] || "—"}
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">No projects yet. Create your first project to get started.</p>
        </div>
      )}
    </div>
  );
}

function CreateProjectForm({ teams, onSave, onCancel }: {
  teams: Team[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamId, setTeamId] = useState<number | "">(teams[0]?.id ?? "");

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-surface-800 mb-4">Create New Project</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Project Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Platform Modernization" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Team</label>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : "")} className="input">
            <option value="">No team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-surface-600 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" placeholder="Brief description" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Target End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => {
            if (name) onSave({
              name,
              description,
              original_start_date: startDate || null,
              original_end_date: endDate || null,
              team_id: teamId || null,
            });
          }}
          disabled={!name}
          className="btn-primary"
        >Create Project</button>
      </div>
    </div>
  );
}
