import type { SupabaseClient } from '@supabase/supabase-js';

export type UrgencyLevel = 'high' | 'medium' | 'low';

export type ProjectStatus =
  | 'new'
  | 'under_analysis'
  | 'prioritized'
  | 'in_development'
  | 'in_testing'
  | 'implemented'
  | 'maintenance'
  | 'closed'
  | 'rejected';

export type SprintStatus = 'planned' | 'ongoing' | 'closed';

export type SprintAllocationStatus = 'planned' | 'in_progress' | 'done' | 'carried_over';

export interface PriorityWeightsRow {
  id: string;
  created_at: string;
  impact_weight: number;
  frequency_weight: number;
  urgency_weight: number;
  is_active: boolean;
}

export interface PriorityWeightsUpdate {
  impact_weight?: number;
  frequency_weight?: number;
  urgency_weight?: number;
  is_active?: boolean;
}

export interface ProjectsRow {
  id: string;
  created_at: string;
  updated_at: string;
  requesting_department: string;
  title: string;
  short_description: string | null;
  problem_description: string;
  context: string | null;
  impact_categories: string[] | null;
  impact_description: string | null;
  impact_score: number;
  frequency_description: string | null;
  frequency_score: number;
  urgency_level: UrgencyLevel;
  urgency_score: number;
  score_raw: number;
  score_weighted: number;
  has_external_dependencies: boolean;
  dependencies_detail: string | null;
  other_departments_involved: string | null;
  contact_name: string;
  contact_department: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ProjectStatus;
  analysis_started_at: string | null;
  development_started_at: string | null;
  implemented_at: string | null;
  closed_at: string | null;
  management_comments: string | null;
}

export interface ProjectsInsert {
  requesting_department: string;
  title: string;
  problem_description: string;
  impact_score: number;
  frequency_score: number;
  urgency_level: UrgencyLevel;
  urgency_score: number;
  score_raw: number;
  score_weighted: number;
  contact_name: string;
  short_description?: string | null;
  context?: string | null;
  impact_categories?: string[] | null;
  impact_description?: string | null;
  frequency_description?: string | null;
  has_external_dependencies?: boolean;
  dependencies_detail?: string | null;
  other_departments_involved?: string | null;
  contact_department?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status?: ProjectStatus;
  analysis_started_at?: string | null;
  development_started_at?: string | null;
  implemented_at?: string | null;
  closed_at?: string | null;
  management_comments?: string | null;
}

export interface ProjectsUpdate {
  requesting_department?: string;
  title?: string;
  problem_description?: string;
  impact_categories?: string[] | null;
  impact_description?: string | null;
  impact_score?: number;
  frequency_description?: string | null;
  frequency_score?: number;
  urgency_level?: UrgencyLevel;
  urgency_score?: number;
  score_raw?: number;
  score_weighted?: number;
  has_external_dependencies?: boolean;
  dependencies_detail?: string | null;
  other_departments_involved?: string | null;
  contact_name?: string;
  contact_department?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status?: ProjectStatus;
  analysis_started_at?: string | null;
  development_started_at?: string | null;
  implemented_at?: string | null;
  closed_at?: string | null;
  management_comments?: string | null;
  short_description?: string | null;
  context?: string | null;
}

export interface SprintsRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity_points: number;
  notes: string | null;
  status: SprintStatus;
}

export interface SprintsInsert {
  name: string;
  start_date: string;
  end_date: string;
  capacity_points: number;
  notes?: string | null;
  status?: SprintStatus;
}

export interface SprintsUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  capacity_points?: number;
  notes?: string | null;
  status?: SprintStatus;
}

export interface SprintAllocationsRow {
  id: string;
  created_at: string;
  updated_at: string;
  sprint_id: string;
  project_id: string;
  allocated_points: number;
  sprint_status: SprintAllocationStatus;
  comments: string | null;
}

export interface SprintAllocationsInsert {
  sprint_id: string;
  project_id: string;
  allocated_points: number;
  sprint_status?: SprintAllocationStatus;
  comments?: string | null;
}

export interface SprintAllocationsUpdate {
  sprint_id?: string;
  project_id?: string;
  allocated_points?: number;
  sprint_status?: SprintAllocationStatus;
  comments?: string | null;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectsRow;
        Insert: ProjectsInsert;
        Update: ProjectsUpdate;
      };
      priority_weights: {
        Row: PriorityWeightsRow;
        Insert: PriorityWeightsRow;
        Update: PriorityWeightsUpdate;
      };
      sprints: {
        Row: SprintsRow;
        Insert: SprintsInsert;
        Update: SprintsUpdate;
      };
      sprint_allocations: {
        Row: SprintAllocationsRow;
        Insert: SprintAllocationsInsert;
        Update: SprintAllocationsUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TypedSupabaseClient = SupabaseClient<Database>;

