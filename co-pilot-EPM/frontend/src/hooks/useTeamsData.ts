// src/hooks/useTeamsData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Team } from "@/types";
import toast from "react-hot-toast";

export function useTeamsData() {
  const qc = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: api.listTeams,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const createTeam = useMutation({
    mutationFn: api.createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Team>) =>
      api.updateTeam(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTeam = useMutation({
    mutationFn: api.deleteTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const memberCountByTeam = (teamId: number) =>
    members.filter((m) => m.team_id === teamId).length;

  const projectCountByTeam = (teamId: number) =>
    projects.filter((p) => p.team_id === teamId).length;

  return {
    teams,
    isLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    memberCountByTeam,
    projectCountByTeam,
  };
}