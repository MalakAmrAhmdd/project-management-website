import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Member, Team } from "@/types";
import toast from "react-hot-toast";

export function useTeamDetailData(teamId: number) {
  const qc = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api.getTeam(teamId),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const updateTeam = useMutation({
    mutationFn: (data: Partial<Team>) => api.updateTeam(teamId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Team updated");
    },
  });

  const createMember = useMutation({
    mutationFn: api.createMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", teamId] });
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: ({ id: mid, ...data }: { id: number } & Partial<Member>) =>
      api.updateMember(mid, data),
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

  const teamProjects = projects.filter((p) => p.team_id === teamId);

  return {
    team,
    isLoading,
    teamProjects,
    updateTeam,
    createMember,
    updateMember,
    deleteMember,
  };
}