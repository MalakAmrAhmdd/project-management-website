'use client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { incrementName } from "@/lib/utils";
import { ProjectFull } from "@/types";

export function useProjectDetailData(projectId: number) {
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["project", projectId] });

  const updateProject = useMutation({
    mutationFn: ({ pid, ...data }: { pid: number } & Partial<ProjectFull>) =>
      api.updateProject(pid, data),
    onSuccess: () => { inv(); toast.success("Project updated"); },
  });

  const createPhase = useMutation({
    mutationFn: api.createPhase,
    onSuccess: () => { inv(); toast.success("Phase added"); },
  });

  const createMilestone = useMutation({
    mutationFn: api.createMilestone,
    onSuccess: () => { inv(); toast.success("Milestone added"); },
  });

  const createEpic = useMutation({
    mutationFn: api.createEpic,
    onSuccess: () => { inv(); toast.success("Epic added"); },
  });

  const createStory = useMutation({
    mutationFn: api.createStory,
    onSuccess: () => { inv(); toast.success("Story added"); },
  });

  // smart add phase logic lives here since it depends on project data
  const handleAddPhase = () => {
    if (!project) return;
    const phases = project.phases;
    const last = phases[phases.length - 1];
    const newData: any = { name: "New Phase", project_id: project.id };
    if (last) {
      newData.name = incrementName(last.name);
      newData.state = last.state;
      newData.original_start_date =
        last.adaptive_end_date || last.original_end_date || undefined;
      newData.original_end_date = last.original_end_date || undefined;
    }
    createPhase.mutate(newData);
  };

  return {
    project,
    isLoading,
    members,
    updateProject,
    createPhase,
    createMilestone,
    createEpic,
    createStory,
    handleAddPhase,
  };
}