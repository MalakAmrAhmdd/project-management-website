"use client";

import { Plus, FolderKanban } from "lucide-react";
import { useState } from "react";
import { ProjectCard } from "@/components/Shared/ProjectCard";
import { CreateProjectForm } from "@/components/Shared/CreateProjectForm";
import { ProjectsLoadingGrid } from "@/components/Shared/ProjectSkeleton";
import { useProjectsData } from "@/hooks/useProjectsData";

export default function ProjectsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { projects, teams, teamMap, isLoading, createProject, deleteProject } =
    useProjectsData();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Projects</h1>
          <p className="text-surface-500 text-sm mt-1">
            Manage engineering projects and their full hierarchy
          </p>
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
          <p className="text-surface-500">
            No projects yet. Create your first project to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary mt-4 inline-flex"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      )}
    </div>
  );
}