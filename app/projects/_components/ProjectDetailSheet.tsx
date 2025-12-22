'use client';

import type { ProjectsRow, ProjectStatus, UrgencyLevel } from '@/lib/types/database';
import type { ProjectAllocationSummary } from '../actions';

type LabelRecord<T extends string> = Record<T, string>;

export type ProjectDetailSheetProps = {
  project: ProjectsRow | null;
  onClose: () => void;
  allocations: ProjectAllocationSummary[];
  loadingAllocations: boolean;
  allocationsError: string | null;
  statusLabels: LabelRecord<ProjectStatus>;
  urgencyLabels: LabelRecord<UrgencyLevel>;
  departmentLabels: Record<string, string>;
};

const formatDateTime = (value: string | null, includeTime = false): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const formatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? {
        hour: '2-digit',
        minute: '2-digit',
      }
      : {}),
  });
  return formatter.format(date);
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement => (
  <section className="space-y-2">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">{children}</div>
  </section>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement => (
  <div className="flex flex-col gap-1 border-b border-dashed border-slate-200 pb-2 last:border-b-0 last:pb-0">
    <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{value ?? '—'}</span>
  </div>
);

export function ProjectDetailSheet({
  project,
  onClose,
  allocations,
  loadingAllocations,
  allocationsError,
  statusLabels,
  urgencyLabels,
  departmentLabels,
}: ProjectDetailSheetProps): React.ReactElement | null {
  if (!project) {
    return null;
  }

  const impactCategories =
    project.impact_categories && project.impact_categories.length > 0
      ? project.impact_categories.join(', ')
      : '—';

  const dependencyLabel = project.has_external_dependencies ? 'Sí' : 'No';

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-slate-900/30" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar panel" />
      <aside className="max-w-xl w-full overflow-y-auto bg-slate-50 px-6 py-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">
              {departmentLabels[project.requesting_department] ?? project.requesting_department}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{project.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Estado:{' '}
              <span className="font-medium">
                {statusLabels[project.status] ?? project.status}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-slate-500 shadow-sm transition hover:text-slate-900"
            aria-label="Cerrar panel de detalle"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <Section title="Información general">
            <div className="space-y-2">
              {project.short_description ? (
                <p className="text-sm text-slate-700">{project.short_description}</p>
              ) : null}
              <DetailRow label="Contexto" value={project.context ?? '—'} />
            </div>
          </Section>

          <Section title="Problema">
            <p className="whitespace-pre-wrap text-sm text-slate-800">{project.problem_description}</p>
          </Section>

          <Section title="Impacto">
            <div className="space-y-2">
              <DetailRow label="Categorías" value={impactCategories} />
              <DetailRow label="Descripción" value={project.impact_description ?? '—'} />
              <DetailRow label="Puntaje" value={project.impact_score} />
            </div>
          </Section>

          <Section title="Frecuencia del problema">
            <div className="space-y-2">
              <DetailRow label="Descripción" value={project.frequency_description ?? '—'} />
              <DetailRow label="Puntaje" value={project.frequency_score} />
              {project.frequency_number && (
                <DetailRow label="Frecuencia estructurada" value={`${project.frequency_number} por ${project.frequency_unit === 'day' ? 'día' : project.frequency_unit === 'week' ? 'semana' : 'mes'}`} />
              )}
            </div>
          </Section>

          <Section title="Urgencia">
            <div className="space-y-2">
              <DetailRow
                label="Nivel"
                value={urgencyLabels[project.urgency_level] ?? project.urgency_level}
              />
              <DetailRow label="Fecha carga" value={formatDateTime(project.created_at, true)} />
            </div>
          </Section>

          <Section title="Dependencias">
            <div className="space-y-2">
              <DetailRow label="Requiere cambios externos" value={dependencyLabel} />
              <DetailRow label="Detalle" value={project.dependencies_detail ?? '—'} />
              <DetailRow label="Otras gerencias involucradas" value={project.other_departments_involved ?? '—'} />
            </div>
          </Section>

          <Section title="Usuario">
            <div className="space-y-2">
              <DetailRow label="Nombre" value={project.contact_name} />
              <DetailRow label="Gerencia del usuario" value={departmentLabels[project.contact_department ?? ''] ?? project.contact_department ?? '—'} />
              <DetailRow label="Email usuario" value={project.contact_email ?? '—'} />
              <DetailRow label="Teléfono usuario" value={project.contact_phone ?? '—'} />
            </div>
          </Section>

          <Section title="Historial de estado">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <DetailRow label="Inicio análisis" value={formatDateTime(project.analysis_started_at, true)} />
              <DetailRow label="Inicio desarrollo" value={formatDateTime(project.development_started_at, true)} />
              <DetailRow label="Implementado" value={formatDateTime(project.implemented_at, true)} />
              <DetailRow label="Cierre" value={formatDateTime(project.closed_at, true)} />
              <DetailRow label="Comentarios gestión" value={project.management_comments ?? '—'} />
            </div>
          </Section>

          <Section title="Asignaciones a sprints">
            {loadingAllocations ? (
              <p className="text-sm text-slate-600">Cargando asignaciones...</p>
            ) : allocationsError ? (
              <p className="text-sm text-red-600">{allocationsError}</p>
            ) : allocations.length === 0 ? (
              <p className="text-sm text-slate-600">Este proyecto aún no tiene asignaciones de sprint.</p>
            ) : (
              <div className="space-y-3">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.allocationId}
                    className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">{allocation.sprintName}</p>
                    <p className="text-xs text-slate-500">
                      {allocation.startDate ? formatDateTime(allocation.startDate) : 'Sin fecha'} -{' '}
                      {allocation.endDate ? formatDateTime(allocation.endDate) : 'Sin fecha'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>
                        Puntos asignados:{' '}
                        <span className="font-semibold text-slate-800">{allocation.allocatedPoints}</span>
                      </span>
                      <span>
                        Estado asignación:{' '}
                        <span className="font-semibold text-slate-800">{allocation.allocationStatus}</span>
                      </span>
                    </div>
                    {allocation.comments ? (
                      <p className="mt-2 text-xs text-slate-600">
                        Comentarios: <span className="text-slate-800">{allocation.comments}</span>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}

