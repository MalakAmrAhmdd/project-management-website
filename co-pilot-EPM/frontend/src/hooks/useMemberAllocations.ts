// src/hooks/useMemberAllocations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Allocation } from "@/types";
import toast from "react-hot-toast";

interface UseAllocationsOptions {
  memberId?: number;
  milestoneId?: number;
  projectId?: number;
}

export function useMemberAllocations({
  memberId,
  milestoneId,
  projectId,
}: UseAllocationsOptions) {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["members"] });

    if (memberId) {
      qc.invalidateQueries({ queryKey: ["member-contributions", memberId] });
    }
    if (milestoneId) {
      qc.invalidateQueries({ queryKey: ["milestone-contribs", milestoneId] });
      qc.invalidateQueries({ queryKey: ["allocations", milestoneId] });
      qc.invalidateQueries({ queryKey: ["milestone", milestoneId] });
    }
    if (projectId) {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    }
  };

  const createAlloc = useMutation({
    mutationFn: api.createAllocation,
    onSuccess: () => { invalidateAll(); toast.success("Resource allocated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAlloc = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Allocation>) =>
      api.updateAllocation(id, data),
    onSuccess: () => { invalidateAll(); toast.success("Allocation updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAlloc = useMutation({
    mutationFn: api.deleteAllocation,
    onSuccess: () => { invalidateAll(); toast.success("Allocation removed"); },
  });

  return { createAlloc, updateAlloc, deleteAlloc };
}