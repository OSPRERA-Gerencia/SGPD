import { z } from 'zod';
import type { SprintAllocationStatus, SprintStatus } from '../types/database';

const SPRINT_STATUS_VALUES = ['planned', 'ongoing', 'closed'] as const satisfies readonly SprintStatus[];
const SPRINT_ALLOCATION_STATUS_VALUES = ['planned', 'in_progress', 'done', 'carried_over'] as const satisfies readonly SprintAllocationStatus[];

export const sprintFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string({ required_error: 'El nombre del sprint es obligatorio.' })
    .trim()
    .min(1, { message: 'El nombre del sprint es obligatorio.' }),
  startDate: z
    .string({ required_error: 'La fecha de inicio es obligatoria.' })
    .trim()
    .min(1, { message: 'La fecha de inicio es obligatoria.' }),
  endDate: z
    .string({ required_error: 'La fecha de fin es obligatoria.' })
    .trim()
    .min(1, { message: 'La fecha de fin es obligatoria.' }),
  capacityPoints: z
    .number({ required_error: 'La capacidad de puntos es obligatoria.' })
    .int({ message: 'La capacidad debe ser un número entero.' })
    .min(0, { message: 'La capacidad no puede ser negativa.' }),
  notes: z.string().trim().optional(),
  status: z.enum(SPRINT_STATUS_VALUES, {
    required_error: 'Seleccioná un estado válido.',
  }),
});

export type SprintFormValues = z.infer<typeof sprintFormSchema>;

export const allocatePointsSchema = z.object({
  sprintId: z.string().uuid({ message: 'Sprint inválido.' }),
  projectId: z.string().uuid({ message: 'Proyecto inválido.' }),
  allocatedPoints: z
    .number({ required_error: 'Los puntos asignados son obligatorios.' })
    .int({ message: 'Los puntos asignados deben ser un número entero.' })
    .min(0, { message: 'Los puntos asignados no pueden ser negativos.' }),
  sprintStatus: z.enum(SPRINT_ALLOCATION_STATUS_VALUES).optional(),
  comments: z.string().optional(),
});

export type AllocatePointsValues = z.infer<typeof allocatePointsSchema>;

export const updateAllocationSchema = allocatePointsSchema
  .extend({
    allocationId: z.string().uuid({ message: 'Asignación inválida.' }),
  })
  .omit({ projectId: true, sprintId: true });

export type UpdateAllocationValues = z.infer<typeof updateAllocationSchema>;


