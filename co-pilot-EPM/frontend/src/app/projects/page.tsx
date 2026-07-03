"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, FolderKanban } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ProjectCard } from "@/components/Shared/ProjectCard";
import { CreateProjectForm } from "@/components/Shared/CreateProjectForm";
import { ProjectsLoadingGrid } from "@/components/Shared/ProjectSkeleton";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: api.listTeams });
  const [showCreate, setShowCreate] = useState(false);

    // create a new project, refresh the list, and close the form on success
  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project created with placeholder hierarchy"); setShowCreate(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  // delete a project and refresh the list on success
  const deleteProject = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Lookup table: team id -> team name, used to label each ProjectCard
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

      {showCreate && (
        <CreateProjectForm
          teams={teams}
          onSave={(data) => createProject.mutate(data)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {isLoading && <ProjectsLoadingGrid />}

      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              teamName={p.team_id ? teamMap[p.team_id] : undefined}
              onDelete={(id) => deleteProject.mutate(id)}
            />
          ))}
        </div>
      )}


      {!isLoading && projects.length === 0 && (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">No projects yet. Create your first project to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      )}
    </div>
  );
}
