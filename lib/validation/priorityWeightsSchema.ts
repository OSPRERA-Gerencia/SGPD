import { z } from 'zod';

const EPSILON = 1e-6;

export const priorityWeightsSchema = z
  .object({
    impactWeight: z
      .coerce.number()
      .min(0, { message: 'El peso de impacto no puede ser negativo.' })
      .max(1, { message: 'El peso de impacto no puede superar 1.' }),
    frequencyWeight: z
      .coerce.number()
      .min(0, { message: 'El peso de frecuencia no puede ser negativo.' })
      .max(1, { message: 'El peso de frecuencia no puede superar 1.' }),
    urgencyWeight: z
      .coerce.number()
      .min(0, { message: 'El peso de urgencia no puede ser negativo.' })
      .max(1, { message: 'El peso de urgencia no puede superar 1.' }),
  })
  .superRefine((values, ctx) => {
    const total = values.impactWeight + values.frequencyWeight + values.urgencyWeight;
    if (Math.abs(total - 1) > EPSILON) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La suma de los pesos debe ser exactamente 1.',
        path: ['impactWeight'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La suma de los pesos debe ser exactamente 1.',
        path: ['frequencyWeight'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La suma de los pesos debe ser exactamente 1.',
        path: ['urgencyWeight'],
      });
    }
  });

export type PriorityWeightsFormValues = z.infer<typeof priorityWeightsSchema>;

