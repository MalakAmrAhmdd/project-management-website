// src/hooks/useDashboardData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboardData() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.dashboardSummary,
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["resource-health"],
    queryFn: api.resourceHealth,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["project-timeline"],
    queryFn: api.projectTimeline,
  });

  const allocationPieData = summary
    ? [
        { name: "Over-allocated",  value: summary.over_allocated_resources },
        { name: "Optimal",         value: summary.optimal_resources },
        { name: "Under-utilized",  value: summary.under_utilized_resources },
        { name: "Unallocated",     value: summary.unallocated_resources },
      ]
    : [];

  const projectStateData = summary
    ? Object.entries(summary.projects_by_state).map(([state, count]) => ({
        state,
        count,
      }))
    : [];

  return {
    summary,
    health,
    timeline,
    allocationPieData,
    projectStateData,
  };
}