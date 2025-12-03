'use server';

import { z } from 'zod';

import { sprintFormSchema, allocatePointsSchema, updateAllocationSchema } from '@/lib/validation/sprintSchemas';
import { SprintsRepository } from '@/lib/repositories/SprintsRepository';
import {
  SprintAllocationsRepository,
  type AllocationWithProject,
} from '@/lib/repositories/SprintAllocationsRepository';
import { ProjectsRepository } from '@/lib/repositories/ProjectsRepository';
import type { ProjectsRow, SprintAllocationsRow, SprintsRow } from '@/lib/types/database';

const BACKLOG_LIMIT = 100;

export type SprintSummary = {
  sprint: SprintsRow;
  allocatedPoints: number;
  availablePoints: number;
};

export type SprintAllocationWithProject = AllocationWithProject;

export type SprintDetail = {
  summary: SprintSummary;
  allocations: SprintAllocationWithProject[];
  backlog: ProjectsRow[];
};

export type SprintOperationResult =
  | {
      success: true;
      summaries: SprintSummary[];
      detail: SprintDetail | null;
    }
  | {
    success: false;
    error: string;
    fieldErrors?: Record<string, string[]>;
  };

export type SprintDetailResult =
  | {
      success: true;
      detail: SprintDetail;
    }
  | {
      success: false;
      error: string;
    };

const buildSprintSummary = async (sprint: SprintsRow): Promise<SprintSummary> => {
  const allocated = await SprintAllocationsRepository.getTotalAllocatedPointsBySprint(sprint.id);
  return {
    sprint,
    allocatedPoints: allocated,
    availablePoints: Math.max(0, sprint.capacity_points - allocated),
  };
};

const listSprintSummaries = async (): Promise<SprintSummary[]> => {
  const sprints = await SprintsRepository.listSprints();
  const summaries = await Promise.all(sprints.map((sprint) => buildSprintSummary(sprint)));
  return summaries.sort((a, b) => new Date(a.sprint.start_date).getTime() - new Date(b.sprint.start_date).getTime());
};

const toDetail = async (sprint: SprintsRow): Promise<SprintDetail> => {
  const summary = await buildSprintSummary(sprint);
  const allocationsWithProjects = await SprintAllocationsRepository.listAllocationsWithProjectBySprint(sprint.id);
  const assignedProjectIds = new Set(allocationsWithProjects.map((item) => item.project?.id).filter(Boolean) as string[]);

  // Only show prioritized projects in the backlog
  const topProjects = await ProjectsRepository.listTopProjects(BACKLOG_LIMIT, { status: 'prioritized' });
  const backlog = topProjects.filter((project) => !assignedProjectIds.has(project.id));

  const orderedAllocations = allocationsWithProjects.map((allocation) => ({
    ...allocation,
  }));

  return {
    summary,
    allocations: orderedAllocations,
    backlog,
  };
};

const ensureSprintExists = (sprint: SprintsRow | null, sprintId: string): SprintsRow => {
  if (!sprint) {
    throw new Error(`El sprint ${sprintId} no existe.`);
  }
  return sprint;
};

const assertCapacityForNewAllocation = async (sprintId: string, newPoints: number): Promise<void> => {
  const sprint = ensureSprintExists(await SprintsRepository.getSprintById(sprintId), sprintId);
  const totalAllocated = await SprintAllocationsRepository.getTotalAllocatedPointsBySprint(sprintId);

  if (totalAllocated + newPoints > sprint.capacity_points) {
    throw new Error('La asignación supera la capacidad total del sprint.');
  }
};

const assertCapacityForUpdate = async (
  sprintId: string,
  allocationId: string,
  newPoints: number,
): Promise<void> => {
  const sprint = ensureSprintExists(await SprintsRepository.getSprintById(sprintId), sprintId);
  const allocation = await SprintAllocationsRepository.getAllocationById(allocationId);
  if (!allocation) {
    throw new Error('La asignación que intentás actualizar no existe.');
  }

  const totalAllocated = await SprintAllocationsRepository.getTotalAllocatedPointsBySprint(sprintId);
  const totalAfterUpdate = totalAllocated - allocation.allocated_points + newPoints;

  if (totalAfterUpdate > sprint.capacity_points) {
    throw new Error('La actualización supera la capacidad total del sprint.');
  }
};

export async function getSprintDetailAction(sprintId: string): Promise<SprintDetailResult> {
  try {
    const sprint = await SprintsRepository.getSprintById(sprintId);
    if (!sprint) {
      return {
        success: false,
        error: 'El sprint seleccionado no existe.',
      };
    }

    const detail = await toDetail(sprint);
    return {
      success: true,
      detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener el detalle del sprint.';
    return {
      success: false,
      error: message,
    };
  }
}

export async function createOrUpdateSprintAction(formData: FormData): Promise<SprintOperationResult> {
  const raw = {
    id: formData.get('id')?.toString(),
    name: formData.get('name')?.toString() ?? '',
    startDate: formData.get('startDate')?.toString() ?? '',
    endDate: formData.get('endDate')?.toString() ?? '',
    capacityPoints: Number(formData.get('capacityPoints')),
    notes: formData.get('notes')?.toString(),
    status: formData.get('status')?.toString() ?? 'planned',
  };

  const parsed = sprintFormSchema.safeParse(raw);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      success: false,
      error: formErrors[0] ?? 'Revisá los datos del sprint.',
      fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    let sprint: SprintsRow | null = null;

    if (data.id) {
      sprint = await SprintsRepository.updateSprint(data.id, {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        capacityPoints: data.capacityPoints,
        notes: data.notes,
        status: data.status,
      });

      if (!sprint) {
        throw new Error('El sprint que intentás actualizar no existe.');
      }
    } else {
      sprint = await SprintsRepository.createSprint({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        capacityPoints: data.capacityPoints,
        notes: data.notes,
        status: data.status,
      });
    }

    const [summaries, detail] = await Promise.all([listSprintSummaries(), toDetail(sprint)]);

    return {
      success: true,
      summaries,
      detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar el sprint.';
    return {
      success: false,
      error: message,
    };
  }
}

export async function deleteSprintAction(sprintId: string): Promise<SprintOperationResult> {
  try {
    // First check if there are any allocations
    const allocations = await SprintAllocationsRepository.listAllocationsBySprint(sprintId);
    if (allocations.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar un sprint con proyectos asignados. Eliminá las asignaciones primero.',
      };
    }

    await SprintsRepository.deleteSprint(sprintId);
    
    const summaries = await listSprintSummaries();
    const detail = summaries.length > 0 ? await toDetail(summaries[0].sprint) : null;

    return {
      success: true,
      summaries,
      detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar el sprint.';
    return {
      success: false,
      error: message,
    };
  }
}

export type AllocationOperationResult =
  | {
      success: true;
      summaries: SprintSummary[];
      detail: SprintDetail;
    }
  | {
      success: false;
      error: string;
    };

export async function allocatePointsToProjectAction(values: z.infer<typeof allocatePointsSchema>): Promise<AllocationOperationResult> {
  const parsed = allocatePointsSchema.safeParse(values);

  if (!parsed.success) {
    const { formErrors } = parsed.error.flatten();
    return {
      success: false,
      error: formErrors[0] ?? 'Revisá los datos de la asignación.',
    };
  }

  const data = parsed.data;

  try {
    const existing = await SprintAllocationsRepository.getAllocationBySprintAndProject(data.sprintId, data.projectId);
    if (existing) {
      throw new Error('Este proyecto ya tiene puntos asignados en el sprint seleccionado.');
    }

    await assertCapacityForNewAllocation(data.sprintId, data.allocatedPoints);

    await SprintAllocationsRepository.allocatePointsToProject({
      sprintId: data.sprintId,
      projectId: data.projectId,
      allocatedPoints: data.allocatedPoints,
      sprintStatus: data.sprintStatus,
      comments: data.comments ?? null,
    });

    const [summaries, sprint] = await Promise.all([
      listSprintSummaries(),
      SprintsRepository.getSprintById(data.sprintId),
    ]);

    if (!sprint) {
      throw new Error('El sprint seleccionado no existe.');
    }

    const detail = await toDetail(sprint);

    return {
      success: true,
      summaries,
      detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al asignar puntos al proyecto.';
    return {
      success: false,
      error: message,
    };
  }
}

export async function updateSprintAllocationAction(values: z.infer<typeof updateAllocationSchema> & { sprintId: string }): Promise<AllocationOperationResult> {
  const parsed = updateAllocationSchema.safeParse(values);

  if (!parsed.success) {
    const { formErrors } = parsed.error.flatten();
    return {
      success: false,
      error: formErrors[0] ?? 'Revisá los datos de la asignación.',
    };
  }

  const data = parsed.data;

  try {
    const allocation = await SprintAllocationsRepository.getAllocationById(values.allocationId);
    if (!allocation) {
      throw new Error('La asignación que intentás actualizar no existe.');
    }

    await assertCapacityForUpdate(values.sprintId, values.allocationId, data.allocatedPoints);

    await SprintAllocationsRepository.updateAllocation({
      allocationId: values.allocationId,
      allocatedPoints: data.allocatedPoints,
      sprintStatus: data.sprintStatus,
      comments: data.comments ?? null,
    });

    const [summaries, sprint] = await Promise.all([
      listSprintSummaries(),
      SprintsRepository.getSprintById(values.sprintId),
    ]);

    if (!sprint) {
      throw new Error('El sprint asociado no existe.');
    }

    const detail = await toDetail(sprint);

    return {
      success: true,
      summaries,
      detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar la asignación.';
    return {
      success: false,
      error: message,
    };
  }
}

export async function getSprintSummaries(): Promise<SprintSummary[]> {
  return listSprintSummaries();
}

export async function getSprintDetailForServer(sprintId: string): Promise<SprintDetail | null> {
  const sprint = await SprintsRepository.getSprintById(sprintId);
  if (!sprint) {
    return null;
  }
  return toDetail(sprint);
}


