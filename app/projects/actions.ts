'use server';

import { projectFormSchema, type ProjectFormValues } from '@/lib/validation/projectFormSchema';
import {
  ProjectsRepository,
  type ProjectListSortField,
  type SortDirection,
} from '@/lib/repositories/ProjectsRepository';

const departmentLabels: Record<string, string> = {
  intervention: 'Intervención',
  general_management: 'Gerencia General',
  medical_services: 'Gerencia de Prestaciones Médicas',
  administration_finance: 'Gerencia Administración y Finanzas',
  beneficiary_services: 'Gerencia Servicios a Beneficiarios',
  legal_affairs: 'Gerencia de Asuntos Jurídicos',
  human_resources: 'Gerencia de Recursos Humanos',
  purchasing: 'Gerencia de Compras',
  processes_systems: 'Gerencia Procesos y Sistemas',
};
import { PriorityWeightsRepository } from '@/lib/repositories/PriorityWeightsRepository';
import { SprintAllocationsRepository } from '@/lib/repositories/SprintAllocationsRepository';
import { SprintsRepository } from '@/lib/repositories/SprintsRepository';
import {
  calculateWeightedScore,
  type PriorityInputs,
  type PriorityWeights,
} from '@/lib/priorityScoring';
import type {
  ProjectsRow,
  SprintAllocationsRow,
  SprintsRow,
} from '@/lib/types/database';
import {
  priorityWeightsSchema,
  type PriorityWeightsFormValues,
} from '@/lib/validation/priorityWeightsSchema';

type CreateProjectSuccess = {
  success: true;
  projectId: string;
};

type CreateProjectFailure = {
  success: false;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CreateProjectResult = CreateProjectSuccess | CreateProjectFailure;

const toNullable = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toOptional = (value?: string | null): string | undefined => {
  const normalized = toNullable(value);
  return normalized ?? undefined;
};

export async function createProjectAction(values: ProjectFormValues): Promise<CreateProjectResult> {
  const parsed = projectFormSchema.safeParse(values);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      success: false,
      formError: formErrors[0],
      fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    // Convertir el código de gerencia al nombre en español
    const departmentName = departmentLabels[data.requestingDepartment] ?? data.requestingDepartment;

    const project = await ProjectsRepository.createProject({
      requestingDepartment: departmentName,
      title: data.title,
      shortDescription: toNullable(data.shortDescription ?? undefined),
      problemDescription: data.problemDescription,
      impactCategories: data.impactCategories && data.impactCategories.length > 0 ? data.impactCategories : null,
      impactDescription: toNullable(data.impactDescription ?? undefined),
      impactScore: data.impactScore,
      frequencyDescription: toNullable(data.frequencyDescription ?? undefined),
      frequencyScore: data.frequencyScore,
      urgencyLevel: data.urgencyLevel,
      hasExternalDependencies: data.hasExternalDependencies,
      dependenciesDetail: toNullable(data.dependenciesDetail ?? undefined),
      otherDepartmentsInvolved: toNullable(data.otherDepartmentsInvolved ?? undefined),
      contactName: data.contactName,
      contactDepartment: toNullable(data.contactDepartment ?? undefined),
      contactEmail: toOptional(data.contactEmail ?? undefined),
      contactPhone: toNullable(data.contactPhone ?? undefined),
    });

    // Create Jira ticket asynchronously (don't block project creation if Jira fails)
    const { createJiraTicket } = await import('@/lib/services/jira');

    createJiraTicket({
      title: data.title,
      description: data.problemDescription,
      urgency: data.urgencyLevel,
      // We don't have story points or time size in the project form yet
      // These can be added later if needed
    }).then((result) => {
      if (result.success) {
        console.log(`[Jira] Successfully created ticket ${result.issueKey} for project ${project.id}`);
      } else {
        console.error(`[Jira] Failed to create ticket for project ${project.id}:`, result.error);
      }
    }).catch((error) => {
      console.error(`[Jira] Unexpected error creating ticket for project ${project.id}:`, error);
    });

    return {
      success: true,
      projectId: project.id,
    };
  } catch (error) {
    console.error('Error en createProjectAction:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido al crear el proyecto.';
    return {
      success: false,
      formError: message,
    };
  }
}

type UpdateWeightsSuccess = {
  success: true;
  weights: PriorityWeights;
  projects: ProjectsRow[];
};

type UpdateWeightsFailure = {
  success: false;
  formError: string;
  fieldErrors?: Record<string, string[]>;
};

export type UpdateWeightsResult = UpdateWeightsSuccess | UpdateWeightsFailure;

const EPSILON = 1e-6;

const toPriorityInputs = (project: ProjectsRow): PriorityInputs => ({
  impactScore: project.impact_score,
  frequencyScore: project.frequency_score,
  urgencyLevel: project.urgency_level,
});

const listProjectsWithOrder = async (
  sortField: ProjectListSortField = 'score_weighted',
  sortDirection: SortDirection = 'desc',
): Promise<ProjectsRow[]> => {
  return ProjectsRepository.listProjects({
    sortField,
    sortDirection,
  });
};

export async function updateWeightsAndRecalculateScores(
  values: PriorityWeightsFormValues,
): Promise<UpdateWeightsResult> {
  const parsed = priorityWeightsSchema.safeParse(values);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      success: false,
      formError: formErrors[0] ?? 'Revisá los pesos ingresados.',
      fieldErrors,
    };
  }

  try {
    const updatedWeights = await PriorityWeightsRepository.updateActiveWeights({
      impactWeight: parsed.data.impactWeight,
      frequencyWeight: parsed.data.frequencyWeight,
      urgencyWeight: parsed.data.urgencyWeight,
    });

    const currentProjects = await listProjectsWithOrder();

    await Promise.all(
      currentProjects.map(async (project) => {
        const newWeighted = calculateWeightedScore(toPriorityInputs(project), updatedWeights);
        if (Math.abs(newWeighted - project.score_weighted) <= EPSILON) {
          return;
        }
        await ProjectsRepository.updateProjectWeightedScore(project.id, newWeighted);
      }),
    );

    const refreshedProjects = await listProjectsWithOrder();

    return {
      success: true,
      weights: updatedWeights,
      projects: refreshedProjects,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar los pesos de prioridad.';
    return {
      success: false,
      formError: message,
    };
  }
}

export type ProjectAllocationSummary = {
  allocationId: string;
  sprintId: string;
  sprintName: string;
  sprintStatus: SprintsRow['status'] | 'desconocido';
  startDate: string | null;
  endDate: string | null;
  allocatedPoints: number;
  allocationStatus: SprintAllocationsRow['sprint_status'];
  comments: string | null;
};

type GetProjectAllocationsSuccess = {
  success: true;
  allocations: ProjectAllocationSummary[];
};

type GetProjectAllocationsFailure = {
  success: false;
  message: string;
};

export type GetProjectAllocationsResult = GetProjectAllocationsSuccess | GetProjectAllocationsFailure;

export async function getProjectAllocationsAction(projectId: string): Promise<GetProjectAllocationsResult> {
  if (!projectId) {
    return {
      success: false,
      message: 'Identificador de proyecto inválido.',
    };
  }

  try {
    const allocations = await SprintAllocationsRepository.listAllocationsByProject(projectId);

    if (allocations.length === 0) {
      return {
        success: true,
        allocations: [],
      };
    }

    const sprintIds = Array.from(new Set(allocations.map((item) => item.sprint_id)));

    const sprintEntries = await Promise.all(
      sprintIds.map(async (sprintId) => {
        const sprint = await SprintsRepository.getSprintById(sprintId);
        return [sprintId, sprint] as const;
      }),
    );

    const sprintMap = new Map<string, SprintsRow | null>(sprintEntries);

    const allocationSummaries = allocations.map<ProjectAllocationSummary>((allocation) => {
      const sprint = sprintMap.get(allocation.sprint_id) ?? null;
      return {
        allocationId: allocation.id,
        sprintId: allocation.sprint_id,
        sprintName: sprint?.name ?? 'Sprint desconocido',
        sprintStatus: sprint?.status ?? 'desconocido',
        startDate: sprint?.start_date ?? null,
        endDate: sprint?.end_date ?? null,
        allocatedPoints: allocation.allocated_points,
        allocationStatus: allocation.sprint_status,
        comments: allocation.comments ?? null,
      };
    });

    return {
      success: true,
      allocations: allocationSummaries,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener asignaciones del proyecto.';
    return {
      success: false,
      message,
    };
  }
}

