export type ItemState = "NOT_STARTED" | "ACTIVE" | "ON_HOLD" | "PENDING" | "COMPLETED";

export interface Team {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamWithMembers extends Team {
  members: Member[];
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  team_id: number;
  allocation_percentage: number;
  overall_avg_velocity: number;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  state: ItemState;
  total_estimated_points: number;
  num_allocated_resources: number;
  original_start_date: string | null;
  original_end_date: string | null;
  actual_start_date: string | null;
  adaptive_end_date: string | null;
  team_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Phase {
  id: number;
  name: string;
  description: string;
  state: ItemState;
  order_index: number;
  is_placeholder: boolean;
  total_estimated_points: number;
  num_allocated_resources: number;
  original_start_date: string | null;
  original_end_date: string | null;
  actual_start_date: string | null;
  adaptive_end_date: string | null;
  project_id: number;
}

export interface Milestone {
  id: number;
  name: string;
  description: string;
  state: ItemState;
  order_index: number;
  is_placeholder: boolean;
  total_estimated_points: number;
  num_allocated_resources: number;
  original_start_date: string | null;
  original_end_date: string | null;
  actual_start_date: string | null;
  adaptive_end_date: string | null;
  phase_id: number;
}

export interface Epic {
  id: number;
  name: string;
  description: string;
  state: ItemState;
  order_index: number;
  is_placeholder: boolean;
  total_estimated_points: number;
  num_allocated_resources: number;
  original_start_date: string | null;
  original_end_date: string | null;
  actual_start_date: string | null;
  adaptive_end_date: string | null;
  milestone_id: number;
}

export interface Story {
  id: number;
  name: string;
  description: string;
  state: ItemState;
  order_index: number;
  is_placeholder: boolean;
  estimated_points: number;
  epic_id: number;
}

export interface Allocation {
  id: number;
  member_id: number;
  milestone_id: number;
  velocity_if_100_pct: number;
  contribution_percentage: number;
  effective_velocity: number;
  average_fto: number;
  member_name?: string;
  member_email?: string;
  milestone_name?: string;
  phase_name?: string;
  project_name?: string;
}

export interface ChangeLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  reason: string;
  changed_by: string;
  changed_at: string;
}

export interface ProjectFull extends Project {
  phases: (Phase & {
    milestones: (Milestone & {
      epics: (Epic & {
        stories: Story[];
      })[];
    })[];
  })[];
}

export interface DashboardSummary {
  total_projects: number;
  active_milestones: number;
  total_members: number;
  over_allocated_resources: number;
  under_utilized_resources: number;
  optimal_resources: number;
  unallocated_resources: number;
  projects_by_state: Record<string, number>;
}

export interface ResourceHealth {
  id: number;
  name: string;
  email: string;
  allocation_percentage: number;
  overall_avg_velocity: number;
  status: "over_allocated" | "optimal" | "under_utilized" | "unallocated";
}

export interface TimelineMilestone {
  id: number;
  name: string;
  state: string;
  is_placeholder: boolean;
  total_estimated_points: number;
  num_allocated_resources: number;
  start_date: string;
  end_date: string;
  original_end_date: string;
}

export interface TimelinePhase {
  id: number;
  name: string;
  state: string;
  is_placeholder: boolean;
  start_date: string;
  end_date: string;
  milestones: TimelineMilestone[];
}

export interface TimelineProject {
  id: number;
  name: string;
  state: string;
  start_date: string;
  end_date: string;
  phases: TimelinePhase[];
}

export interface ContributionRow {
  allocation_id: number;
  member_id: number;
  member_name: string;
  milestone_id: number;
  milestone_name: string;
  milestone_state: string;
  project_name: string;
  velocity_if_100_pct: number;
  contribution_percentage: number;
  effective_velocity: number;
  average_fto: number;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  accent?: boolean;
}

export interface ProjectCardProps {
  project: Project;
  teamName?: string;
  onDelete: (id: number) => void;
}

export interface CreateProjectFormProps {
  teams: Team[];
  onSave: (data: any) => void;
  onCancel: () => void;
}