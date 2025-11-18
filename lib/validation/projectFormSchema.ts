import { z } from 'zod';
import type { UrgencyLevel } from '../types/database';

export const REQUESTING_DEPARTMENT_VALUES = ['operations', 'technology', 'marketing', 'finance', 'hr', 'other'] as const;

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
    required_error: 'La gerencia solicitante es obligatoria.',
    invalid_type_error: 'Seleccioná una gerencia válida.',
  }),
  title: z
    .string({ required_error: 'El título es obligatorio.' })
    .trim()
    .min(1, { message: 'El título es obligatorio.' }),
  shortDescription: optionalTrimmedString,
  problemDescription: z
    .string({ required_error: 'La descripción del problema es obligatoria.' })
    .trim()
    .min(1, { message: 'La descripción del problema es obligatoria.' }),
  context: optionalTrimmedString,
  impactCategories: z.array(z.enum(IMPACT_CATEGORY_VALUES)).optional().default([]),
  impactDescription: optionalTrimmedString,
  impactScore: z
    .coerce
    .number({ required_error: 'Seleccioná un puntaje de impacto.' })
    .min(1, { message: 'El puntaje de impacto debe ser entre 1 y 5.' })
    .max(5, { message: 'El puntaje de impacto debe ser entre 1 y 5.' }),
  frequencyDescription: optionalTrimmedString,
  frequencyScore: z
    .coerce
    .number({ required_error: 'Seleccioná un puntaje de frecuencia.' })
    .min(1, { message: 'El puntaje de frecuencia debe ser entre 1 y 5.' })
    .max(5, { message: 'El puntaje de frecuencia debe ser entre 1 y 5.' }),
  urgencyLevel: z.enum(URGENCY_LEVEL_VALUES, {
    required_error: 'Seleccioná un nivel de urgencia.',
  }) satisfies z.ZodEnum<typeof URGENCY_LEVEL_VALUES>,
  hasExternalDependencies: z.boolean().default(false),
  dependenciesDetail: optionalTrimmedString,
  otherDepartmentsInvolved: optionalTrimmedString,
  contactName: z
    .string({ required_error: 'El nombre referente es obligatorio.' })
    .trim()
    .min(1, { message: 'El nombre referente es obligatorio.' }),
  contactDepartment: optionalTrimmedString,
  contactEmail: optionalEmailSchema,
  contactPhone: optionalTrimmedString,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

