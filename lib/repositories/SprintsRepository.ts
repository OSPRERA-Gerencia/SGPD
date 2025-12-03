import { isSupabaseConfigured, supabaseServerClient } from '../supabaseClient';
import {
  type SprintStatus,
  type SprintsInsert,
  type SprintsRow,
  type SprintsUpdate,
  type TypedSupabaseClient,
} from '../types/database';
import { memorySprints } from './inMemoryStore';

const getClient = (): TypedSupabaseClient => supabaseServerClient() as TypedSupabaseClient;

export type CreateSprintInput = {
  name: string;
  startDate: string;
  endDate: string;
  capacityPoints: number;
  notes?: string | null;
  status?: SprintStatus;
};

export type UpdateSprintInput = Partial<CreateSprintInput>;

export type SprintFilters = {
  status?: SprintStatus | SprintStatus[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  search?: string;
};

const escapeIlikeValue = (value: string): string =>
  value
    .trim()
    .replace(/[%_]/g, '\\$&')
    .replace(/,/g, '\\,');

export class SprintsRepository {
  static async createSprint(input: CreateSprintInput): Promise<SprintsRow> {
    if (!isSupabaseConfigured()) {
      return memorySprints.createSprint({
        name: input.name,
        start_date: input.startDate,
        end_date: input.endDate,
        capacity_points: input.capacityPoints,
        notes: input.notes ?? null,
        status: input.status ?? 'planned',
      });
    }

    const supabase = getClient();
    const payload: SprintsInsert = {
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      capacity_points: input.capacityPoints,
      notes: input.notes ?? null,
      status: input.status,
    };

    // @ts-expect-error - Supabase types issue in build
    const { data, error } = await supabase.from('sprints').insert(payload).select('*').single();

    if (error) {
      throw new Error(`Error al crear el sprint: ${error.message}`);
    }

    return data;
  }

  static async updateSprint(id: string, input: UpdateSprintInput): Promise<SprintsRow | null> {
    if (!isSupabaseConfigured()) {
      return memorySprints.updateSprint(id, {
        name: input.name,
        start_date: input.startDate,
        end_date: input.endDate,
        capacity_points: input.capacityPoints,
        notes: input.notes ?? null,
        status: input.status,
      });
    }

    const supabase = getClient();
    const updates: SprintsUpdate = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.startDate !== undefined) {
      updates.start_date = input.startDate;
    }
    if (input.endDate !== undefined) {
      updates.end_date = input.endDate;
    }
    if (input.capacityPoints !== undefined) {
      updates.capacity_points = input.capacityPoints;
    }
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }
    if (input.status !== undefined) {
      updates.status = input.status;
    }

    if (Object.keys(updates).length === 0) {
      return this.getSprintById(id);
    }

    // @ts-expect-error - Supabase types issue in build
    const { data, error } = await supabase.from('sprints').update(updates).eq('id', id).select('*').maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el sprint ${id}: ${error.message}`);
    }

    return data ?? null;
  }

  static async listSprints(filters: SprintFilters = {}): Promise<SprintsRow[]> {
    if (!isSupabaseConfigured()) {
      return memorySprints.listSprints(filters);
    }

    const supabase = getClient();
    let query = supabase.from('sprints').select('*');

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.startDateFrom) {
      query = query.gte('start_date', filters.startDateFrom);
    }
    if (filters.startDateTo) {
      query = query.lte('start_date', filters.startDateTo);
    }
    if (filters.endDateFrom) {
      query = query.gte('end_date', filters.endDateFrom);
    }
    if (filters.endDateTo) {
      query = query.lte('end_date', filters.endDateTo);
    }

    if (filters.search) {
      const escaped = escapeIlikeValue(filters.search);
      query = query.ilike('name', `%${escaped}%`);
    }

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) {
      throw new Error(`Error al listar sprints: ${error.message}`);
    }

    return data ?? [];
  }

  static async getSprintById(id: string): Promise<SprintsRow | null> {
    if (!isSupabaseConfigured()) {
      return memorySprints.getSprintById(id);
    }

    const supabase = getClient();
    const { data, error } = await supabase.from('sprints').select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el sprint ${id}: ${error.message}`);
    }

    return data ?? null;
  }

  static async deleteSprint(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      // In-memory implementation would go here if needed
      return;
    }

    const supabase = getClient();
    const { error } = await supabase.from('sprints').delete().eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar el sprint: ${error.message}`);
    }
  }
}

