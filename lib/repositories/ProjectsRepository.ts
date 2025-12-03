import { isSupabaseConfigured, supabaseServerClient } from '../supabaseClient';
import {
  type ProjectStatus,
  type ProjectsInsert,
  type ProjectsRow,
  type ProjectsUpdate,
  type TypedSupabaseClient,
  type UrgencyLevel,
} from '../types/database';
import {
  calculateRawScore,
  calculateWeightedScore,
  mapUrgencyToScore,
  type PriorityInputs,
} from '../priorityScoring';
import { PriorityWeightsRepository } from './PriorityWeightsRepository';
import { memoryProjects } from './inMemoryStore';

const getClient = (): TypedSupabaseClient => supabaseServerClient() as TypedSupabaseClient;

const DEFAULT_LIST_LIMIT = 100;
const DEFAULT_SORT_FIELD: ProjectListSortField = 'score_weighted';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

export type SortDirection = 'asc' | 'desc';
export type ProjectListSortField = 'score_weighted' | 'score_raw' | 'created_at';

const escapeIlikeValue = (value: string): string =>
  value
    .trim()
    .replace(/[%_]/g, '\\$&')
    .replace(/,/g, '\\,');

export type ProjectCreationInput = {
  requestingDepartment: string;
  title: string;
  shortDescription?: string | null;
  problemDescription: string;
  context?: string | null;
  impactCategories?: string[] | null;
  impactDescription?: string | null;
  impactScore: number;
  frequencyDescription?: string | null;
  frequencyScore: number;
  urgencyLevel: UrgencyLevel;
  hasExternalDependencies?: boolean;
  dependenciesDetail?: string | null;
  otherDepartmentsInvolved?: string | null;
  contactName: string;
  contactDepartment?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: ProjectStatus;
  analysisStartedAt?: string | null;
  developmentStartedAt?: string | null;
  implementedAt?: string | null;
  closedAt?: string | null;
  managementComments?: string | null;
};

export type ProjectFilters = {
  requestingDepartment?: string;
  status?: ProjectStatus | ProjectStatus[];
  search?: string;
  minScoreWeighted?: number;
  maxScoreWeighted?: number;
  limit?: number;
  offset?: number;
  sortField?: ProjectListSortField;
  sortDirection?: SortDirection;
};

export type ProjectMilestoneUpdates = {
  analysisStartedAt?: string | null;
  developmentStartedAt?: string | null;
  implementedAt?: string | null;
  closedAt?: string | null;
};

export class ProjectsRepository {
  static async createProject(input: ProjectCreationInput): Promise<ProjectsRow> {
    const weights = await PriorityWeightsRepository.getActiveWeights();

    const priorityInputs: PriorityInputs = {
      impactScore: input.impactScore,
      frequencyScore: input.frequencyScore,
      urgencyLevel: input.urgencyLevel,
    };

    const urgencyScore = mapUrgencyToScore(input.urgencyLevel);
    const scoreRaw = calculateRawScore({
      impactScore: input.impactScore,
      frequencyScore: input.frequencyScore,
      urgencyScore,
    });
    const scoreWeighted = calculateWeightedScore(priorityInputs, weights);

    const payload: ProjectsInsert = {
      requesting_department: input.requestingDepartment,
      title: input.title,
      short_description: input.shortDescription ?? null,
      problem_description: input.problemDescription,
      context: input.context ?? null,
      impact_categories: input.impactCategories ?? null,
      impact_description: input.impactDescription ?? null,
      impact_score: input.impactScore,
      frequency_description: input.frequencyDescription ?? null,
      frequency_score: input.frequencyScore,
      urgency_level: input.urgencyLevel,
      urgency_score: urgencyScore,
      score_raw: scoreRaw,
      score_weighted: scoreWeighted,
      has_external_dependencies: input.hasExternalDependencies ?? false,
      dependencies_detail: input.dependenciesDetail ?? null,
      other_departments_involved: input.otherDepartmentsInvolved ?? null,
      contact_name: input.contactName,
      contact_department: input.contactDepartment ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      status: input.status,
      analysis_started_at: input.analysisStartedAt ?? null,
      development_started_at: input.developmentStartedAt ?? null,
      implemented_at: input.implementedAt ?? null,
      closed_at: input.closedAt ?? null,
      management_comments: input.managementComments ?? null,
    };

    if (!isSupabaseConfigured()) {
      console.warn('[ProjectsRepository] Supabase no configurado, usando almacenamiento en memoria');
      return memoryProjects.createProject(payload);
    }

    console.log('[ProjectsRepository] Intentando crear proyecto en Supabase...');
    const supabase = getClient();
    // @ts-expect-error - Supabase types issue in build
    const { data, error } = await supabase.from('projects').insert(payload).select('*').single();

    if (error) {
      console.error('Error de Supabase al crear proyecto:', error);
      throw new Error(`Error al crear el proyecto: ${error.message} (Código: ${error.code || 'N/A'})`);
    }

    if (!data) {
      console.error('No se recibieron datos de Supabase después de crear el proyecto');
      throw new Error('Error al crear el proyecto: No se recibieron datos del servidor.');
    }

    return data;
  }

  static async listProjects(filters: ProjectFilters = {}): Promise<ProjectsRow[]> {
    if (!isSupabaseConfigured()) {
      return memoryProjects.listProjects(filters);
    }

    const supabase = getClient();
    let query = supabase.from('projects').select('*');

    if (filters.requestingDepartment) {
      query = query.eq('requesting_department', filters.requestingDepartment);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.search) {
      const escaped = escapeIlikeValue(filters.search);
      query = query.or(`title.ilike.%${escaped}%,short_description.ilike.%${escaped}%`);
    }

    if (typeof filters.minScoreWeighted === 'number') {
      query = query.gte('score_weighted', filters.minScoreWeighted);
    }

    if (typeof filters.maxScoreWeighted === 'number') {
      query = query.lte('score_weighted', filters.maxScoreWeighted);
    }

    if (typeof filters.offset === 'number') {
      const limit = filters.limit ?? DEFAULT_LIST_LIMIT;
      const start = filters.offset;
      const end = start + limit - 1;
      query = query.range(start, end);
    } else if (typeof filters.limit === 'number') {
      query = query.limit(filters.limit);
    }

    const sortField = filters.sortField ?? DEFAULT_SORT_FIELD;
    const sortDirection = filters.sortDirection ?? DEFAULT_SORT_DIRECTION;

    const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });

    if (error) {
      throw new Error(`Error al listar proyectos: ${error.message}`);
    }

    return data ?? [];
  }

  static async listTopProjects(limit: number, filters: Omit<ProjectFilters, 'limit' | 'offset'> = {}): Promise<ProjectsRow[]> {
    if (limit <= 0) {
      throw new Error('El límite debe ser mayor que cero.');
    }

    if (!isSupabaseConfigured()) {
      return memoryProjects.listTopProjects(limit, filters);
    }

    return this.listProjects({
      ...filters,
      limit,
      sortField: filters.sortField ?? 'score_weighted',
      sortDirection: filters.sortDirection ?? 'desc',
    });
  }

  static async getProjectById(id: string): Promise<ProjectsRow | null> {
    if (!isSupabaseConfigured()) {
      return memoryProjects.getProjectById(id);
    }

    const supabase = getClient();
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el proyecto ${id}: ${error.message}`);
    }

    return data ?? null;
  }

  static async updateProjectStatus(
    id: string,
    newStatus: ProjectStatus,
    milestoneDates: ProjectMilestoneUpdates = {},
  ): Promise<ProjectsRow | null> {
    if (!isSupabaseConfigured()) {
      return memoryProjects.updateProjectStatus(id, newStatus, milestoneDates);
    }

    const supabase = getClient();

    const updates: ProjectsUpdate = {
      status: newStatus,
    };

    if (milestoneDates.analysisStartedAt !== undefined) {
      updates.analysis_started_at = milestoneDates.analysisStartedAt;
    }
    if (milestoneDates.developmentStartedAt !== undefined) {
      updates.development_started_at = milestoneDates.developmentStartedAt;
    }
    if (milestoneDates.implementedAt !== undefined) {
      updates.implemented_at = milestoneDates.implementedAt;
    }
    if (milestoneDates.closedAt !== undefined) {
      updates.closed_at = milestoneDates.closedAt;
    }

    // @ts-expect-error - Supabase types issue in build
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select('*').maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el estado del proyecto ${id}: ${error.message}`);
    }

    return data ?? null;
  }

  static async updateProjectWeightedScore(id: string, scoreWeighted: number): Promise<void> {
    if (!isSupabaseConfigured()) {
      memoryProjects.updateProjectWeightedScore(id, scoreWeighted);
      return;
    }

    const supabase = getClient();
    const { error } = await supabase
      .from('projects')
      // @ts-expect-error - Supabase types issue in build
      .update({ score_weighted: scoreWeighted })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar el score ponderado del proyecto ${id}: ${error.message}`);
    }
  }

  static async updateProject(id: string, updates: ProjectsUpdate): Promise<ProjectsRow | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[ProjectsRepository] Supabase no configurado');
      return null;
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el proyecto ${id}: ${error.message}`);
    }

    return data ?? null;
  }
}

