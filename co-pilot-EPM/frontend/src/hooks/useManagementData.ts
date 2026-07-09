import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { flattenMilestones } from "@/lib/utils";
import { TimelineProject } from "@/types";

export function useManagementData(selectedProjectId: number | null) {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["project-timeline"],
    queryFn: api.projectTimeline,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
  });

  const allMilestones = flattenMilestones(timeline);

  const projectMilestones = selectedProjectId
    ? allMilestones.filter((ms) => {
        const proj = timeline.find((p) => p.id === selectedProjectId);
        return proj?.phases.some((ph) =>
          ph.milestones.some((m) => m.id === ms.id),
        );
      })
    : allMilestones;

  return { projects, timeline, members, allMilestones, projectMilestones };
}