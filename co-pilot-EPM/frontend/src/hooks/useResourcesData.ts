import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Member } from "@/types";
import { getAllocationStatus } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
import { RESOURCE_COLUMNS } from "@/lib/constants";
import { useColumnVisibility } from "@/components/ColumnToggle";

export function useResourcesData(
  search: string,
  filterTeam: number | null,
  filterStatus: string | null,
) {
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: api.listTeams,
  });

  const createMember = useMutation({
    mutationFn: api.createMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Member>) =>
      api.updateMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = members.filter((m) => {
    if (
      search &&
      !m.name.toLowerCase().includes(search.toLowerCase()) &&
      !m.email.toLowerCase().includes(search.toLowerCase())
    ) return false;
    if (filterTeam && m.team_id !== filterTeam) return false;
    if (filterStatus && getAllocationStatus(m.allocation_percentage) !== filterStatus) return false;
    return true;
  });

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  return { teams, filtered, teamMap, isLoading, createMember, updateMember, deleteMember };
}

