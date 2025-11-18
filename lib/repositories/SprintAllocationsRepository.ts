import { isSupabaseConfigured, supabaseServerClient } from '../supabaseClient';
import {
  type ProjectsRow,
  type SprintAllocationsInsert,
  type SprintAllocationsRow,
  type SprintAllocationsUpdate,
  type SprintAllocationStatus,
  type TypedSupabaseClient,
} from '../types/database';
import { memorySprintAllocations } from './inMemoryStore';

const getClient = (): TypedSupabaseClient => supabaseServerClient() as TypedSupabaseClient;

export type AllocatePointsInput = {
  sprintId: string;
  projectId: string;
  allocatedPoints: number;
  sprintStatus?: SprintAllocationStatus;
  comments?: string | null;
};

export type UpdateAllocationInput = {
  allocationId: string;
  allocatedPoints?: number;
  sprintStatus?: SprintAllocationStatus;
  comments?: string | null;
};

export type AllocationWithProject = SprintAllocationsRow & {
  project: ProjectsRow | null;
};

export class SprintAllocationsRepository {
  static async allocatePointsToProject(input: AllocatePointsInput): Promise<SprintAllocationsRow> {
    if (input.allocatedPoints < 0) {
      throw new Error('Los puntos asignados deben ser mayores o iguales a cero.');
    }

    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.allocatePoints({
        sprintId: input.sprintId,
        projectId: input.projectId,
        allocatedPoints: input.allocatedPoints,
        sprintStatus: input.sprintStatus,
        comments: input.comments ?? null,
      });
    }

    const supabase = getClient();
    const payload: SprintAllocationsInsert = {
      sprint_id: input.sprintId,
      project_id: input.projectId,
      allocated_points: input.allocatedPoints,
      sprint_status: input.sprintStatus,
      comments: input.comments ?? null,
    };

    // @ts-expect-error - Supabase types issue in build
    const { data, error } = await supabase.from('sprint_allocations').insert(payload).select('*').single();

    if (error) {
      throw new Error(
        `Error al asignar puntos al proyecto ${input.projectId} en el sprint ${input.sprintId}: ${error.message}`,
      );
    }

    return data;
  }

  static async updateAllocation(input: UpdateAllocationInput): Promise<SprintAllocationsRow | null> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.updateAllocation(input.allocationId, {
        allocated_points: input.allocatedPoints,
        sprint_status: input.sprintStatus,
        comments: input.comments ?? null,
      });
    }

    const supabase = getClient();
    const updates: SprintAllocationsUpdate = {};

    if (input.allocatedPoints !== undefined) {
      if (input.allocatedPoints < 0) {
        throw new Error('Los puntos asignados deben ser mayores o iguales a cero.');
      }
      updates.allocated_points = input.allocatedPoints;
    }

    if (input.sprintStatus !== undefined) {
      updates.sprint_status = input.sprintStatus;
    }

    if (input.comments !== undefined) {
      updates.comments = input.comments;
    }

    if (Object.keys(updates).length === 0) {
      const allocation = await this.getAllocationById(input.allocationId);
      return allocation;
    }

    const { data, error } = await supabase
      .from('sprint_allocations')
      // @ts-expect-error - Supabase types issue in build
      .update(updates)
      .eq('id', input.allocationId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar la asignación ${input.allocationId}: ${error.message}`);
    }

    return data ?? null;
  }

  static async getAllocationById(allocationId: string): Promise<SprintAllocationsRow | null> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.getAllocationById(allocationId);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('sprint_allocations')
      .select('*')
      .eq('id', allocationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener la asignación ${allocationId}: ${error.message}`);
    }

    return data ?? null;
  }

  static async getAllocationBySprintAndProject(
    sprintId: string,
    projectId: string,
  ): Promise<SprintAllocationsRow | null> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.getAllocationBySprintAndProject(sprintId, projectId);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('sprint_allocations')
      .select('*')
      .eq('sprint_id', sprintId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Error al obtener la asignación del proyecto ${projectId} en el sprint ${sprintId}: ${error.message}`,
      );
    }

    return data ?? null;
  }

  static async listAllocationsBySprint(sprintId: string): Promise<SprintAllocationsRow[]> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.listAllocationsBySprint(sprintId);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('sprint_allocations')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al listar asignaciones del sprint ${sprintId}: ${error.message}`);
    }

    return data ?? [];
  }

  static async listAllocationsWithProjectBySprint(sprintId: string): Promise<AllocationWithProject[]> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.listAllocationsWithProjectBySprint(sprintId);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('sprint_allocations')
      .select('*, project:projects(*)')
      .eq('sprint_id', sprintId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al listar asignaciones con proyectos del sprint ${sprintId}: ${error.message}`);
    }

    const rows = (data ?? []) as AllocationWithProject[];
    return rows.map((row) => ({
      ...row,
      project: (row.project as ProjectsRow | null) ?? null,
    }));
  }

  static async listAllocationsByProject(projectId: string): Promise<SprintAllocationsRow[]> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.listAllocationsByProject(projectId);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('sprint_allocations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al listar asignaciones del proyecto ${projectId}: ${error.message}`);
    }

    return data ?? [];
  }

  static async getTotalAllocatedPointsBySprint(sprintId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return memorySprintAllocations.getTotalAllocatedPointsBySprint(sprintId);
    }

    const supabase = getClient();
    const { data, error } = await supabase.from('sprint_allocations').select('allocated_points').eq('sprint_id', sprintId);

    if (error) {
      throw new Error(`Error al obtener el total de puntos asignados del sprint ${sprintId}: ${error.message}`);
    }

    return ((data as any) ?? []).reduce((total: number, row: any) => total + (row.allocated_points ?? 0), 0);
  }
}

