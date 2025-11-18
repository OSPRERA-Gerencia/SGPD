import { randomUUID } from 'crypto';

import type {
  PriorityWeightsRow,
  ProjectsInsert,
  ProjectsRow,
  ProjectStatus,
  SprintAllocationsRow,
  SprintAllocationsUpdate,
  SprintAllocationStatus,
  SprintsInsert,
  SprintsRow,
  SprintsUpdate,
} from '../types/database';
import type { PriorityWeights } from '../priorityScoring';
import { calculateRawScore, calculateWeightedScore, mapUrgencyToScore } from '../priorityScoring';

type MemorySortDirection = 'asc' | 'desc';
type MemoryProjectSortField = 'score_weighted' | 'score_raw' | 'created_at';
type MemoryProjectFilters = {
  requestingDepartment?: string;
  status?: ProjectStatus | ProjectStatus[];
  search?: string;
  minScoreWeighted?: number;
  maxScoreWeighted?: number;
  limit?: number;
  offset?: number;
  sortField?: MemoryProjectSortField;
  sortDirection?: MemorySortDirection;
};

type MemoryProjectMilestoneUpdates = {
  analysisStartedAt?: string | null;
  developmentStartedAt?: string | null;
  implementedAt?: string | null;
  closedAt?: string | null;
};

type MemorySprintFilters = {
  status?: ('planned' | 'ongoing' | 'closed') | ('planned' | 'ongoing' | 'closed')[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  search?: string;
};

type MemoryState = {
  priorityWeights: PriorityWeightsRow;
  projects: ProjectsRow[];
  sprints: SprintsRow[];
  sprintAllocations: SprintAllocationsRow[];
};

const nowIso = (): string => new Date().toISOString();

const priorityWeightsState: PriorityWeightsRow = {
  id: randomUUID(),
  created_at: nowIso(),
  impact_weight: 0.4,
  frequency_weight: 0.4,
  urgency_weight: 0.2,
  is_active: true,
};

const createProjectRow = (input: Omit<ProjectsRow, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): ProjectsRow => ({
  ...input,
  created_at: input.created_at ?? nowIso(),
  updated_at: input.updated_at ?? nowIso(),
});

const projectsState: ProjectsRow[] = [
  createProjectRow({
    id: randomUUID(),
    requesting_department: 'operations',
    title: 'Automatización de conciliaciones',
    short_description: 'Reducir tiempos operativos en conciliaciones contables.',
    problem_description:
      'La gerencia de Operaciones necesita reducir el tiempo que se invierte en conciliaciones manuales que generan demoras en los cierres contables.',
    context: 'Actualmente se utilizan planillas manuales y consultas SQL dispersas.',
    impact_categories: ['efficiency', 'control'],
    impact_description: 'Reduce tiempos operativos y evita errores de control.',
    impact_score: 5,
    frequency_description: 'Conciliaciones diarias para múltiples cuentas.',
    frequency_score: 4,
    urgency_level: 'high',
    urgency_score: mapUrgencyToScore('high'),
    score_raw: calculateRawScore({ impactScore: 5, frequencyScore: 4, urgencyScore: mapUrgencyToScore('high') }),
    score_weighted: calculateWeightedScore(
      { impactScore: 5, frequencyScore: 4, urgencyLevel: 'high' },
      {
        impactWeight: priorityWeightsState.impact_weight,
        frequencyWeight: priorityWeightsState.frequency_weight,
        urgencyWeight: priorityWeightsState.urgency_weight,
      },
    ),
    has_external_dependencies: false,
    dependencies_detail: null,
    other_departments_involved: 'Finanzas',
    contact_name: 'Carolina Torres',
    contact_department: 'Operaciones',
    contact_email: 'carolina.torres@example.com',
    contact_phone: '+54 11 5555-0001',
    status: 'prioritized',
    analysis_started_at: nowIso(),
    development_started_at: null,
    implemented_at: null,
    closed_at: null,
    management_comments: 'En análisis por el equipo de arquitectura.',
  }),
  createProjectRow({
    id: randomUUID(),
    requesting_department: 'technology',
    title: 'Monitoreo centralizado de servicios',
    short_description: 'Dashboard con alertas en tiempo real.',
    problem_description:
      'No existe un tablero unificado para monitorear la salud de los servicios críticos, lo que retrasa la respuesta ante incidentes.',
    context: 'Actualmente se revisan logs manualmente en distintas herramientas.',
    impact_categories: ['control', 'other'],
    impact_description: 'Permite actuar rápidamente ante incidentes y mejorar la disponibilidad.',
    impact_score: 4,
    frequency_description: 'Incidentes semanales afectan a distintos equipos.',
    frequency_score: 3,
    urgency_level: 'medium',
    urgency_score: mapUrgencyToScore('medium'),
    score_raw: calculateRawScore({ impactScore: 4, frequencyScore: 3, urgencyScore: mapUrgencyToScore('medium') }),
    score_weighted: calculateWeightedScore(
      { impactScore: 4, frequencyScore: 3, urgencyLevel: 'medium' },
      {
        impactWeight: priorityWeightsState.impact_weight,
        frequencyWeight: priorityWeightsState.frequency_weight,
        urgencyWeight: priorityWeightsState.urgency_weight,
      },
    ),
    has_external_dependencies: true,
    dependencies_detail: 'Integración con herramientas de observabilidad existentes.',
    other_departments_involved: 'Seguridad informática',
    contact_name: 'Javier Morales',
    contact_department: 'Tecnología',
    contact_email: 'javier.morales@example.com',
    contact_phone: '+54 11 5555-0002',
    status: 'under_analysis',
    analysis_started_at: nowIso(),
    development_started_at: null,
    implemented_at: null,
    closed_at: null,
    management_comments: 'Revisión de herramientas disponibles.',
  }),
  createProjectRow({
    id: randomUUID(),
    requesting_department: 'marketing',
    title: 'Segmentación avanzada de campañas',
    short_description: 'Modelos de segmentación para campañas personalizadas.',
    problem_description:
      'Marketing necesita segmentar mejor a los afiliados para aumentar la conversion de campañas digitales.',
    context: 'Actualmente se utilizan segmentos estáticos y poco precisos.',
    impact_categories: ['member_experience', 'efficiency'],
    impact_description: 'Mejora la experiencia del afiliado y aumenta la eficiencia de las campañas.',
    impact_score: 4,
    frequency_description: 'Campañas mensuales a base completa.',
    frequency_score: 4,
    urgency_level: 'low',
    urgency_score: mapUrgencyToScore('low'),
    score_raw: calculateRawScore({ impactScore: 4, frequencyScore: 4, urgencyScore: mapUrgencyToScore('low') }),
    score_weighted: calculateWeightedScore(
      { impactScore: 4, frequencyScore: 4, urgencyLevel: 'low' },
      {
        impactWeight: priorityWeightsState.impact_weight,
        frequencyWeight: priorityWeightsState.frequency_weight,
        urgencyWeight: priorityWeightsState.urgency_weight,
      },
    ),
    has_external_dependencies: false,
    dependencies_detail: null,
    other_departments_involved: 'Comercial',
    contact_name: 'Luciana Fernández',
    contact_department: 'Marketing',
    contact_email: 'luciana.fernandez@example.com',
    contact_phone: '+54 11 5555-0003',
    status: 'new',
    analysis_started_at: null,
    development_started_at: null,
    implemented_at: null,
    closed_at: null,
    management_comments: null,
  }),
];

const createSprintRow = (input: Omit<SprintsRow, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): SprintsRow => ({
  ...input,
  created_at: input.created_at ?? nowIso(),
  updated_at: input.updated_at ?? nowIso(),
});

const twoWeeksFrom = (date: Date): Date => {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + 14);
  return cloned;
};

const today = new Date();
const sprintStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() % 14));
const sprintEnd = twoWeeksFrom(sprintStart);

const sprintsState: SprintsRow[] = [
  createSprintRow({
    id: randomUUID(),
    name: 'Sprint Inicial',
    start_date: sprintStart.toISOString().slice(0, 10),
    end_date: sprintEnd.toISOString().slice(0, 10),
    capacity_points: 120,
    notes: 'Sprint de referencia para pruebas.',
    status: 'planned',
  }),
];

const sprintAllocationsState: SprintAllocationsRow[] = [
  {
    id: randomUUID(),
    sprint_id: sprintsState[0].id,
    project_id: projectsState[0].id,
    allocated_points: 40,
    sprint_status: 'planned',
    comments: 'Asignado para discovery técnico.',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

const state: MemoryState = {
  priorityWeights: priorityWeightsState,
  projects: projectsState,
  sprints: sprintsState,
  sprintAllocations: sprintAllocationsState,
};

const cloneProject = (project: ProjectsRow): ProjectsRow => ({ ...project });
const cloneSprint = (sprint: SprintsRow): SprintsRow => ({ ...sprint });
const cloneAllocation = (allocation: SprintAllocationsRow): SprintAllocationsRow => ({ ...allocation });

const applyProjectFilters = (projects: ProjectsRow[], filters: MemoryProjectFilters = {}): ProjectsRow[] => {
  let result = [...projects];

  if (filters.requestingDepartment) {
    result = result.filter((project) => project.requesting_department === filters.requestingDepartment);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const statuses = new Set(filters.status);
      result = result.filter((project) => statuses.has(project.status));
    } else {
      result = result.filter((project) => project.status === filters.status);
    }
  }

  if (filters.search) {
    const searchTerm = filters.search.trim().toLowerCase();
    result = result.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm) ||
        (project.short_description?.toLowerCase().includes(searchTerm) ?? false),
    );
  }

  if (typeof filters.minScoreWeighted === 'number') {
    result = result.filter((project) => project.score_weighted >= filters.minScoreWeighted!);
  }

  if (typeof filters.maxScoreWeighted === 'number') {
    result = result.filter((project) => project.score_weighted <= filters.maxScoreWeighted!);
  }

  const sortField: MemoryProjectSortField = filters.sortField ?? 'score_weighted';
  const sortDirection: MemorySortDirection = filters.sortDirection ?? 'desc';

  result.sort((a, b) => {
    let aValue: number;
    let bValue: number;

    if (sortField === 'score_raw') {
      aValue = a.score_raw;
      bValue = b.score_raw;
    } else if (sortField === 'score_weighted') {
      aValue = a.score_weighted;
      bValue = b.score_weighted;
    } else {
      aValue = new Date(a.created_at).getTime();
      bValue = new Date(b.created_at).getTime();
    }

    if (aValue === bValue) {
      return 0;
    }
    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const offset = typeof filters.offset === 'number' ? filters.offset : 0;
  const limit = typeof filters.limit === 'number' ? filters.limit : result.length;

  return result.slice(offset, offset + limit);
};

const applySprintFilters = (sprints: SprintsRow[], filters: MemorySprintFilters = {}): SprintsRow[] => {
  let result = [...sprints];

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const statuses = new Set(filters.status);
      result = result.filter((sprint) => statuses.has(sprint.status));
    } else {
      result = result.filter((sprint) => sprint.status === filters.status);
    }
  }

  if (filters.startDateFrom) {
    result = result.filter((sprint) => sprint.start_date >= filters.startDateFrom!);
  }

  if (filters.startDateTo) {
    result = result.filter((sprint) => sprint.start_date <= filters.startDateTo!);
  }

  if (filters.endDateFrom) {
    result = result.filter((sprint) => sprint.end_date >= filters.endDateFrom!);
  }

  if (filters.endDateTo) {
    result = result.filter((sprint) => sprint.end_date <= filters.endDateTo!);
  }

  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    result = result.filter((sprint) => sprint.name.toLowerCase().includes(term));
  }

  result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  return result;
};

export const memoryPriorityWeights = {
  getActiveWeights: (): PriorityWeights => ({
    impactWeight: state.priorityWeights.impact_weight,
    frequencyWeight: state.priorityWeights.frequency_weight,
    urgencyWeight: state.priorityWeights.urgency_weight,
  }),
  updateActiveWeights: (weights: PriorityWeights): PriorityWeights => {
    state.priorityWeights = {
      ...state.priorityWeights,
      impact_weight: weights.impactWeight,
      frequency_weight: weights.frequencyWeight,
      urgency_weight: weights.urgencyWeight,
    } as PriorityWeightsRow;
    return {
      impactWeight: state.priorityWeights.impact_weight,
      frequencyWeight: state.priorityWeights.frequency_weight,
      urgencyWeight: state.priorityWeights.urgency_weight,
    };
  },
};

export const memoryProjects = {
  createProject: (payload: ProjectsInsert): ProjectsRow => {
    const project: ProjectsRow = {
      id: randomUUID(),
      created_at: nowIso(),
      updated_at: nowIso(),
      requesting_department: payload.requesting_department,
      title: payload.title,
      short_description: payload.short_description ?? null,
      problem_description: payload.problem_description,
      context: payload.context ?? null,
      impact_categories: payload.impact_categories ?? null,
      impact_description: payload.impact_description ?? null,
      impact_score: payload.impact_score,
      frequency_description: payload.frequency_description ?? null,
      frequency_score: payload.frequency_score,
      urgency_level: payload.urgency_level,
      urgency_score: payload.urgency_score,
      score_raw: payload.score_raw,
      score_weighted: payload.score_weighted,
      has_external_dependencies: payload.has_external_dependencies ?? false,
      dependencies_detail: payload.dependencies_detail ?? null,
      other_departments_involved: payload.other_departments_involved ?? null,
      contact_name: payload.contact_name,
      contact_department: payload.contact_department ?? null,
      contact_email: payload.contact_email ?? null,
      contact_phone: payload.contact_phone ?? null,
      status: (payload.status as ProjectStatus | undefined) ?? 'new',
      analysis_started_at: payload.analysis_started_at ?? null,
      development_started_at: payload.development_started_at ?? null,
      implemented_at: payload.implemented_at ?? null,
      closed_at: payload.closed_at ?? null,
      management_comments: payload.management_comments ?? null,
    };

    state.projects.push(project);
    return cloneProject(project);
  },
  listProjects: (filters?: MemoryProjectFilters): ProjectsRow[] => applyProjectFilters(state.projects, filters).map(cloneProject),
  listTopProjects: (limit: number, filters?: MemoryProjectFilters): ProjectsRow[] =>
    applyProjectFilters(state.projects, { ...(filters ?? {}), limit, offset: 0 }).map(cloneProject),
  getProjectById: (id: string): ProjectsRow | null => {
    const project = state.projects.find((item) => item.id === id);
    return project ? cloneProject(project) : null;
  },
  updateProjectStatus: (id: string, newStatus: ProjectStatus, milestoneDates: MemoryProjectMilestoneUpdates = {}): ProjectsRow | null => {
    const project = state.projects.find((item) => item.id === id);
    if (!project) {
      return null;
    }
    project.status = newStatus;
    project.updated_at = nowIso();

    if (milestoneDates.analysisStartedAt !== undefined) {
      project.analysis_started_at = milestoneDates.analysisStartedAt ?? null;
    }
    if (milestoneDates.developmentStartedAt !== undefined) {
      project.development_started_at = milestoneDates.developmentStartedAt ?? null;
    }
    if (milestoneDates.implementedAt !== undefined) {
      project.implemented_at = milestoneDates.implementedAt ?? null;
    }
    if (milestoneDates.closedAt !== undefined) {
      project.closed_at = milestoneDates.closedAt ?? null;
    }

    return cloneProject(project);
  },
  updateProjectWeightedScore: (id: string, scoreWeighted: number): void => {
    const project = state.projects.find((item) => item.id === id);
    if (project) {
      project.score_weighted = scoreWeighted;
      project.updated_at = nowIso();
    }
  },
};

export const memorySprints = {
  createSprint: (input: SprintsInsert): SprintsRow => {
    const sprint: SprintsRow = {
      id: randomUUID(),
      created_at: nowIso(),
      updated_at: nowIso(),
      name: input.name,
      start_date: input.start_date,
      end_date: input.end_date,
      capacity_points: input.capacity_points,
      notes: input.notes ?? null,
      status: input.status ?? 'planned',
    };
    state.sprints.push(sprint);
    return cloneSprint(sprint);
  },
  updateSprint: (id: string, input: SprintsUpdate): SprintsRow | null => {
    const sprint = state.sprints.find((item) => item.id === id);
    if (!sprint) {
      return null;
    }
    if (input.name !== undefined) {
      sprint.name = input.name;
    }
    if (input.start_date !== undefined) {
      sprint.start_date = input.start_date;
    }
    if (input.end_date !== undefined) {
      sprint.end_date = input.end_date;
    }
    if (input.capacity_points !== undefined) {
      sprint.capacity_points = input.capacity_points;
    }
    if (input.notes !== undefined) {
      sprint.notes = input.notes ?? null;
    }
    if (input.status !== undefined) {
      sprint.status = input.status;
    }
    sprint.updated_at = nowIso();
    return cloneSprint(sprint);
  },
  listSprints: (filters?: MemorySprintFilters): SprintsRow[] => applySprintFilters(state.sprints, filters).map(cloneSprint),
  getSprintById: (id: string): SprintsRow | null => {
    const sprint = state.sprints.find((item) => item.id === id);
    return sprint ? cloneSprint(sprint) : null;
  },
};

export const memorySprintAllocations = {
  allocatePoints: (input: { sprintId: string; projectId: string; allocatedPoints: number; sprintStatus?: SprintAllocationStatus; comments?: string | null }): SprintAllocationsRow => {
    const allocation: SprintAllocationsRow = {
      id: randomUUID(),
      sprint_id: input.sprintId,
      project_id: input.projectId,
      allocated_points: input.allocatedPoints,
      sprint_status: input.sprintStatus ?? 'planned',
      comments: input.comments ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.sprintAllocations.push(allocation);
    return cloneAllocation(allocation);
  },
  updateAllocation: (allocationId: string, updates: SprintAllocationsUpdate): SprintAllocationsRow | null => {
    const allocation = state.sprintAllocations.find((item) => item.id === allocationId);
    if (!allocation) {
      return null;
    }
    if (updates.allocated_points !== undefined) {
      allocation.allocated_points = updates.allocated_points;
    }
    if (updates.sprint_status !== undefined) {
      allocation.sprint_status = updates.sprint_status;
    }
    if (updates.comments !== undefined) {
      allocation.comments = updates.comments ?? null;
    }
    allocation.updated_at = nowIso();
    return cloneAllocation(allocation);
  },
  getAllocationById: (allocationId: string): SprintAllocationsRow | null => {
    const allocation = state.sprintAllocations.find((item) => item.id === allocationId);
    return allocation ? cloneAllocation(allocation) : null;
  },
  getAllocationBySprintAndProject: (sprintId: string, projectId: string): SprintAllocationsRow | null => {
    const allocation = state.sprintAllocations.find(
      (item) => item.sprint_id === sprintId && item.project_id === projectId,
    );
    return allocation ? cloneAllocation(allocation) : null;
  },
  listAllocationsBySprint: (sprintId: string): SprintAllocationsRow[] =>
    state.sprintAllocations
      .filter((allocation) => allocation.sprint_id === sprintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(cloneAllocation),
  listAllocationsWithProjectBySprint: (sprintId: string): (SprintAllocationsRow & { project: ProjectsRow | null })[] =>
    state.sprintAllocations
      .filter((allocation) => allocation.sprint_id === sprintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((allocation) => ({
        ...cloneAllocation(allocation),
        project: memoryProjects.getProjectById(allocation.project_id),
      })),
  listAllocationsByProject: (projectId: string): SprintAllocationsRow[] =>
    state.sprintAllocations
      .filter((allocation) => allocation.project_id === projectId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(cloneAllocation),
  getTotalAllocatedPointsBySprint: (sprintId: string): number =>
    state.sprintAllocations
      .filter((allocation) => allocation.sprint_id === sprintId)
      .reduce((total, allocation) => total + allocation.allocated_points, 0),
};


