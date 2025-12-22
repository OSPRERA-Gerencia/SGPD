import { z } from 'zod';
import type { UrgencyLevel } from '../types/database';

export const REQUESTING_DEPARTMENT_VALUES = [
  'intervention',
  'general_management',
  'medical_services',
  'administration_finance',
  'beneficiary_services',
  'legal_affairs',
  'human_resources',
  'purchasing',
  'processes_systems',
] as const;

export const IMPACT_CATEGORY_VALUES = [
  'efficiency',
  'control',
  'member_experience',
  'compliance',
  'other',
] as const;

export const URGENCY_LEVEL_VALUES = ['high', 'medium', 'low'] as const satisfies readonly UrgencyLevel[];

export type RequestingDepartmentValue = typeof REQUESTING_DEPARTMENT_VALUES[number];
export type ImpactCategoryValue = typeof IMPACT_CATEGORY_VALUES[number];
export type UrgencyLevelValue = typeof URGENCY_LEVEL_VALUES[number];

const optionalTrimmedString = z.string().trim().optional();

const optionalEmailSchema = z
  .string()
  .trim()
  .email({ message: 'Email inválido.' })
  .or(z.literal(''))
  .optional();

export const projectFormSchema = z.object({
  requestingDepartment: z.enum(REQUESTING_DEPARTMENT_VALUES, {
    message: 'Seleccioná una gerencia válida.',
  }),
  title: z
    .string()
    .trim()
    .min(1, { message: 'El título es obligatorio.' }),
  shortDescription: optionalTrimmedString,
  problemDescription: z
    .string()
    .trim()
    .min(1, { message: 'La descripción del problema es obligatoria.' }),
  impactCategories: z.array(z.enum(IMPACT_CATEGORY_VALUES)).optional().default([]),
  impactDescription: optionalTrimmedString,
  impactScore: z
    .coerce
    .number()
    .min(1, { message: 'El puntaje de impacto debe ser entre 1 y 5.' })
    .max(5, { message: 'El puntaje de impacto debe ser entre 1 y 5.' }),
  frequencyDescription: optionalTrimmedString,
  frequencyScore: z
    .coerce
    .number()
    .min(1, { message: 'El puntaje de frecuencia debe ser entre 1 y 5.' })
    .max(5, { message: 'El puntaje de frecuencia debe ser entre 1 y 5.' }),
  urgencyLevel: z.enum(URGENCY_LEVEL_VALUES, {
    message: 'Seleccioná un nivel de urgencia.',
  }),
  hasExternalDependencies: z.boolean().default(false),
  dependenciesDetail: optionalTrimmedString,
  otherDepartmentsInvolved: optionalTrimmedString,
  contactName: z
    .string()
    .trim()
    .min(1, { message: 'El nombre del usuario es obligatorio.' }),
  contactDepartment: z.enum(REQUESTING_DEPARTMENT_VALUES).optional(),
  contactEmail: optionalEmailSchema,
  contactPhone: optionalTrimmedString,
  frequencyNumber: z.coerce.number().min(1, { message: 'La cantidad debe ser al menos 1.' }).optional(),
  frequencyUnit: z.enum(['day', 'week', 'month']).optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

