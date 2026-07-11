import {
  Team,
  TeamWithMembers,
  Member,
  Project,
  ProjectFull,
  Phase,
  Milestone,
  Epic,
  Story,
  Allocation,
  ChangeLogEntry,
  DashboardSummary,
  ResourceHealth,
  TimelineProject,
  ContributionRow,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Teams
export const api = {
  // Teams
  listTeams: () => request<Team[]>("/teams/"),
  getTeam: (id: number) => request<TeamWithMembers>(`/teams/${id}`),
  createTeam: (data: Partial<Team>) =>
    request<Team>("/teams/", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: number, data: Partial<Team>) =>
    request<Team>(`/teams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTeam: (id: number) =>
    request<void>(`/teams/${id}`, { method: "DELETE" }),

  // Members
  listMembers: (teamId?: number) =>
    request<Member[]>(`/members/${teamId ? `?team_id=${teamId}` : ""}`),
  getMember: (id: number) => request<Member>(`/members/${id}`),
  getMemberContributions: (id: number) =>
    request<{ member_id: number; contributions: ContributionRow[] }>(
      `/members/${id}/contributions`,
    ),
  createMember: (data: Partial<Member>) =>
    request<Member>("/members/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMember: (id: number, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMember: (id: number) =>
    request<void>(`/members/${id}`, { method: "DELETE" }),

  // Projects
  listProjects: () => request<Project[]>("/projects/"),
  getProject: (id: number) => request<ProjectFull>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: number, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: number) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),

  // Phases
  listPhases: (projectId: number) =>
    request<Phase[]>(`/phases/?project_id=${projectId}`),
  createPhase: (data: Partial<Phase> & { project_id: number }) =>
    request<Phase>("/phases/", { method: "POST", body: JSON.stringify(data) }),
  updatePhase: (id: number, data: Partial<Phase>) =>
    request<Phase>(`/phases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePhase: (id: number) =>
    request<void>(`/phases/${id}`, { method: "DELETE" }),

  // Milestones
  listMilestones: (phaseId: number) =>
    request<Milestone[]>(`/milestones/?phase_id=${phaseId}`),
  getMilestone: (id: number) => request<Milestone>(`/milestones/${id}`),
  getMilestoneContributions: (id: number) =>
    request<{ milestone_id: number; contributions: ContributionRow[] }>(
      `/milestones/${id}/contribution-matrix`,
    ),
  createMilestone: (data: Partial<Milestone> & { phase_id: number }) =>
    request<Milestone>("/milestones/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMilestone: (id: number, data: Partial<Milestone>) =>
    request<Milestone>(`/milestones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMilestone: (id: number) =>
    request<void>(`/milestones/${id}`, { method: "DELETE" }),

  // Epics
  listEpics: (milestoneId: number) =>
    request<Epic[]>(`/epics/?milestone_id=${milestoneId}`),
  createEpic: (data: Partial<Epic> & { milestone_id: number }) =>
    request<Epic>("/epics/", { method: "POST", body: JSON.stringify(data) }),
  updateEpic: (id: number, data: Partial<Epic>) =>
    request<Epic>(`/epics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEpic: (id: number) =>
    request<void>(`/epics/${id}`, { method: "DELETE" }),

  // Stories
  listStories: (epicId: number) =>
    request<Story[]>(`/stories/?epic_id=${epicId}`),
  createStory: (data: Partial<Story> & { epic_id: number }) =>
    request<Story>("/stories/", { method: "POST", body: JSON.stringify(data) }),
  updateStory: (id: number, data: Partial<Story>) =>
    request<Story>(`/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteStory: (id: number) =>
    request<void>(`/stories/${id}`, { method: "DELETE" }),

  // Allocations
  listAllocations: (params?: { milestone_id?: number; member_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.milestone_id)
      qs.set("milestone_id", String(params.milestone_id));
    if (params?.member_id) qs.set("member_id", String(params.member_id));
    return request<Allocation[]>(`/allocations/?${qs.toString()}`);
  },
  createAllocation: (data: Partial<Allocation>) =>
    request<Allocation>("/allocations/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAllocation: (id: number, data: Partial<Allocation>) =>
    request<Allocation>(`/allocations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAllocation: (id: number) =>
    request<void>(`/allocations/${id}`, { method: "DELETE" }),

  // Changelog
  listChangelog: (params?: {
    entity_type?: string;
    entity_id?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.entity_type) qs.set("entity_type", params.entity_type);
    if (params?.entity_id) qs.set("entity_id", String(params.entity_id));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<ChangeLogEntry[]>(`/changelog/?${qs.toString()}`);
  },

  // Dashboard
  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  resourceHealth: () => request<ResourceHealth[]>("/dashboard/resource-health"),
  projectTimeline: () =>
    request<TimelineProject[]>("/dashboard/project-timeline"),
};
