'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createProjectAction } from '../actions';
import {
  IMPACT_CATEGORY_VALUES,
  REQUESTING_DEPARTMENT_VALUES,
  URGENCY_LEVEL_VALUES,
  projectFormSchema,
  type ImpactCategoryValue,
  type ProjectFormValues,
  type RequestingDepartmentValue,
  type UrgencyLevelValue,
} from '@/lib/validation/projectFormSchema';

const requestingDepartmentLabels: Record<RequestingDepartmentValue, string> = {
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

const impactCategoryLabels: Record<ImpactCategoryValue, string> = {
  efficiency: 'Eficiencia',
  control: 'Control',
  member_experience: 'Experiencia Afiliado',
  compliance: 'Cumplimiento Normativo',
  other: 'Otros',
};

const urgencyLevelLabels: Record<UrgencyLevelValue, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const scoreOptions = [1, 2, 3, 4, 5];

const inputClasses =
  'mt-1 w-full rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const textareaClasses = `${inputClasses} min-h-[120px]`;
const labelClasses = 'text-sm font-medium text-slate-700';
const errorClasses = 'mt-1 text-sm text-red-600';

const frequencyUnits = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export default function NewProjectPage(): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema) as any,
    defaultValues: {
      requestingDepartment: 'general_management',
      title: '',
      shortDescription: '',
      problemDescription: '',
      impactCategories: [],
      impactDescription: '',
      impactScore: 3,
      frequencyDescription: '',
      frequencyScore: 3,
      frequencyNumber: 1,
      frequencyUnit: 'week',
      urgencyLevel: 'medium',
      hasExternalDependencies: false,
      dependenciesDetail: '',
      otherDepartmentsInvolved: '',
      contactName: '',
      contactDepartment: 'general_management',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = form;

  const hasExternalDependencies = watch('hasExternalDependencies');
  const frequencyNumber = watch('frequencyNumber');
  const frequencyUnit = watch('frequencyUnit');

  // Logic to show calculated score in UI (informative)
  const currentFrequencyScore = useMemo(() => {
    if (frequencyNumber && frequencyUnit) {
      // Small trick to avoid importing logic here if we don't want to duplicate, 
      // but simpler to just re-implement or import
      const calculate = (n: number, u: string) => {
        if (u === 'day') return n > 1 ? 5 : 4;
        if (u === 'week') return n >= 1 ? 3 : 2;
        if (u === 'month') return n >= 4 ? 4 : (n >= 2 ? 2 : 1);
        return 1;
      };
      return calculate(frequencyNumber, frequencyUnit);
    }
    return 3;
  }, [frequencyNumber, frequencyUnit]);

  const onSubmit = handleSubmit(
    (values) => {
      console.log('[Form] onSubmit llamado con valores:', values);
      setServerError(null);
      setSuccessMessage(null);
      clearErrors();

      console.log('[Form] Iniciando transición...');
      startTransition(() => {
        console.log('[Form] Llamando a createProjectAction...');
        createProjectAction(values)
          .then((result) => {
            console.log('[Form] Respuesta recibida:', result);
            if (!result.success) {
              console.log('[Form] Error en la respuesta:', result);
              if (result.fieldErrors) {
                Object.entries(result.fieldErrors).forEach(([field, messages]) => {
                  if (!messages || messages.length === 0) {
                    return;
                  }
                  setError(field as keyof ProjectFormValues, {
                    type: 'server',
                    message: messages[0],
                  });
                });
              }

              if (result.formError) {
                console.error('[Form] Error del formulario:', result.formError);
                setServerError(result.formError);
              } else {
                console.error('[Form] Error sin mensaje específico');
                setServerError('Error al crear el proyecto. Por favor, intentá nuevamente.');
              }
              return;
            }

            // Éxito - mostrar mensaje y redirigir después de un breve delay
            console.log('[Form] Proyecto creado exitosamente:', result.projectId);
            setServerError(null);
            setSuccessMessage('¡Proyecto creado exitosamente! Redirigiendo...');
            setTimeout(() => {
              router.push('/');
              router.refresh();
            }, 2000);
          })
          .catch((error) => {
            console.error('[Form] Error capturado en catch:', error);
            setServerError(error instanceof Error ? error.message : 'Error inesperado al crear el proyecto.');
          });
      });
    },
    (errors) => {
      console.error('[Form] Errores de validación:', errors);
      setServerError('Por favor, completá todos los campos requeridos correctamente.');
    }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900">Solicitar nuevo proyecto de desarrollo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Completá la información para solicitar tu proyecto de desarrollo. Todos los campos marcados con * son
          obligatorios.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          console.log('[Form] Evento submit del formulario capturado');
          onSubmit(e);
        }}
        className="mt-8 space-y-8"
      >
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Información básica</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClasses} htmlFor="requestingDepartment">
                Gerencia solicitante *
              </label>
              <select
                id="requestingDepartment"
                {...register('requestingDepartment')}
                className={inputClasses}
                aria-invalid={errors.requestingDepartment ? 'true' : 'false'}
              >
                {REQUESTING_DEPARTMENT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {requestingDepartmentLabels[value]}
                  </option>
                ))}
              </select>
              {errors.requestingDepartment?.message ? (
                <p className={errorClasses}>{errors.requestingDepartment.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="title">
                Título del requerimiento *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className={inputClasses}
                aria-invalid={errors.title ? 'true' : 'false'}
              />
              {errors.title?.message ? <p className={errorClasses}>{errors.title.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses} htmlFor="shortDescription">
                Descripción breve
              </label>
              <textarea
                id="shortDescription"
                {...register('shortDescription')}
                className={`${textareaClasses} min-h-[80px]`}
                aria-invalid={errors.shortDescription ? 'true' : 'false'}
              />
              {errors.shortDescription?.message ? <p className={errorClasses}>{errors.shortDescription.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Problema</h2>
          <div className="mt-4 grid grid-cols-1 gap-5">
            <div>
              <label className={labelClasses} htmlFor="problemDescription">
                Descripción del problema o necesidad *
              </label>
              <textarea
                id="problemDescription"
                {...register('problemDescription')}
                className={textareaClasses}
                aria-invalid={errors.problemDescription ? 'true' : 'false'}
              />
              {errors.problemDescription?.message ? (
                <p className={errorClasses}>{errors.problemDescription.message}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Impacto</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <span className={labelClasses}>Categorías de impacto</span>
              <Controller
                name="impactCategories"
                control={control}
                render={({ field }) => {
                  const selectedValues = field.value ?? [];
                  const toggleValue = (value: ImpactCategoryValue, checked: boolean): void => {
                    if (checked) {
                      field.onChange([...selectedValues, value]);
                    } else {
                      field.onChange(selectedValues.filter((item) => item !== value));
                    }
                  };

                  return (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {IMPACT_CATEGORY_VALUES.map((value) => {
                        const checked = selectedValues.includes(value);
                        return (
                          <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={checked}
                              onChange={(event) => toggleValue(value, event.currentTarget.checked)}
                            />
                            {impactCategoryLabels[value]}
                          </label>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {errors.impactCategories?.message ? <p className={errorClasses}>{errors.impactCategories.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses} htmlFor="impactDescription">
                Descripción del impacto
              </label>
              <textarea
                id="impactDescription"
                {...register('impactDescription')}
                className={textareaClasses}
                aria-invalid={errors.impactDescription ? 'true' : 'false'}
              />
              {errors.impactDescription?.message ? (
                <p className={errorClasses}>{errors.impactDescription.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="impactScore">
                Puntaje de impacto *
              </label>
              <Controller
                name="impactScore"
                control={control}
                render={({ field }) => (
                  <select
                    id="impactScore"
                    className={inputClasses}
                    value={field.value?.toString() ?? ''}
                    onChange={(event) => field.onChange(Number(event.currentTarget.value))}
                    aria-invalid={errors.impactScore ? 'true' : 'false'}
                  >
                    <option value="">Seleccioná un puntaje</option>
                    {scoreOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.impactScore?.message ? <p className={errorClasses}>{errors.impactScore.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Frecuencia del problema</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClasses} htmlFor="frequencyDescription">
                Descripción de la frecuencia
              </label>
              <textarea
                id="frequencyDescription"
                {...register('frequencyDescription')}
                className={textareaClasses}
                aria-invalid={errors.frequencyDescription ? 'true' : 'false'}
                placeholder="Ej: Ocurre cada vez que un usuario intenta..."
              />
              {errors.frequencyDescription?.message ? (
                <p className={errorClasses}>{errors.frequencyDescription.message}</p>
              ) : null}
            </div>

            <div className="flex gap-4 md:col-span-2">
              <div className="flex-1">
                <label className={labelClasses} htmlFor="frequencyNumber">
                  Cantidad de veces *
                </label>
                <input
                  id="frequencyNumber"
                  type="number"
                  {...register('frequencyNumber')}
                  className={inputClasses}
                  aria-invalid={errors.frequencyNumber ? 'true' : 'false'}
                />
                {errors.frequencyNumber?.message ? <p className={errorClasses}>{errors.frequencyNumber.message}</p> : null}
              </div>

              <div className="flex-1">
                <label className={labelClasses} htmlFor="frequencyUnit">
                  Cada (tiempo) *
                </label>
                <select
                  id="frequencyUnit"
                  {...register('frequencyUnit')}
                  className={inputClasses}
                  aria-invalid={errors.frequencyUnit ? 'true' : 'false'}
                >
                  {frequencyUnits.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                {errors.frequencyUnit?.message ? <p className={errorClasses}>{errors.frequencyUnit.message}</p> : null}
              </div>
            </div>

            <div className="md:col-span-2 rounded bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Puntaje de frecuencia calculado: <span className="font-bold text-blue-600">{currentFrequencyScore}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Urgencia</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClasses} htmlFor="urgencyLevel">
                Nivel de urgencia *
              </label>
              <select
                id="urgencyLevel"
                {...register('urgencyLevel')}
                className={inputClasses}
                aria-invalid={errors.urgencyLevel ? 'true' : 'false'}
              >
                <option value="">Seleccioná un nivel</option>
                {URGENCY_LEVEL_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {urgencyLevelLabels[value]}
                  </option>
                ))}
              </select>
              {errors.urgencyLevel?.message ? <p className={errorClasses}>{errors.urgencyLevel.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Dependencias y contacto</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <input
                id="hasExternalDependencies"
                type="checkbox"
                {...register('hasExternalDependencies')}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label className={labelClasses} htmlFor="hasExternalDependencies">
                ¿Requiere cambios en otros sistemas?
              </label>
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses} htmlFor="dependenciesDetail">
                Detalle de dependencias
              </label>
              <textarea
                id="dependenciesDetail"
                {...register('dependenciesDetail')}
                className={textareaClasses}
                disabled={!hasExternalDependencies}
                aria-invalid={errors.dependenciesDetail ? 'true' : 'false'}
              />
              {errors.dependenciesDetail?.message ? (
                <p className={errorClasses}>{errors.dependenciesDetail.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="otherDepartmentsInvolved">
                Otras gerencias involucradas
              </label>
              <input
                id="otherDepartmentsInvolved"
                type="text"
                {...register('otherDepartmentsInvolved')}
                className={inputClasses}
                aria-invalid={errors.otherDepartmentsInvolved ? 'true' : 'false'}
              />
              {errors.otherDepartmentsInvolved?.message ? (
                <p className={errorClasses}>{errors.otherDepartmentsInvolved.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="contactName">
                Nombre del usuario *
              </label>
              <input
                id="contactName"
                type="text"
                {...register('contactName')}
                className={inputClasses}
                aria-invalid={errors.contactName ? 'true' : 'false'}
              />
              {errors.contactName?.message ? <p className={errorClasses}>{errors.contactName.message}</p> : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="contactDepartment">
                Gerencia del usuario
              </label>
              <select
                id="contactDepartment"
                {...register('contactDepartment')}
                className={inputClasses}
                aria-invalid={errors.contactDepartment ? 'true' : 'false'}
              >
                {REQUESTING_DEPARTMENT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {requestingDepartmentLabels[value]}
                  </option>
                ))}
              </select>
              {errors.contactDepartment?.message ? (
                <p className={errorClasses}>{errors.contactDepartment.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="contactEmail">
                Email usuario
              </label>
              <input
                id="contactEmail"
                type="email"
                {...register('contactEmail')}
                className={inputClasses}
                aria-invalid={errors.contactEmail ? 'true' : 'false'}
              />
              {errors.contactEmail?.message ? <p className={errorClasses}>{errors.contactEmail.message}</p> : null}
            </div>

            <div>
              <label className={labelClasses} htmlFor="contactPhone">
                Teléfono usuario
              </label>
              <input
                id="contactPhone"
                type="text"
                {...register('contactPhone')}
                className={inputClasses}
                aria-invalid={errors.contactPhone ? 'true' : 'false'}
              />
              {errors.contactPhone?.message ? <p className={errorClasses}>{errors.contactPhone.message}</p> : null}
            </div>
          </div>
        </section>

        {successMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700" role="alert">
            {successMessage}
          </div>
        ) : null}
        {serverError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {serverError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            onClick={() => router.push('/')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isPending}
            onClick={(e) => {
              console.log('[Button] Click en botón Crear proyecto');
              console.log('[Button] isPending:', isPending);
              console.log('[Button] Errores del formulario:', errors);
            }}
          >
            {isPending ? 'Creando...' : 'Crear proyecto'}
          </button>
        </div>
      </form>
    </div>
  );
}

