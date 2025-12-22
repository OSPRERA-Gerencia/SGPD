'use client';

import { memo } from 'react';
import type { ProjectsRow, ProjectStatus, UrgencyLevel } from '@/lib/types/database';
import type { ProjectListSortField, SortDirection } from '@/lib/repositories/ProjectsRepository';

type LabelRecord<T extends string> = Record<T, string>;

export type ProjectsTableProps = {
  projects: ProjectsRow[];
  onProjectClick: (project: ProjectsRow) => void;
  sortField: ProjectListSortField;
  sortDirection: SortDirection;
  onSortChange: (field: ProjectListSortField) => void;
  statusLabels: LabelRecord<ProjectStatus>;
  urgencyLabels: LabelRecord<UrgencyLevel>;
  departmentLabels: Record<string, string>;
};

const formatNumber = (value: number | string | null): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return '—';
  }
  return numericValue.toFixed(2);
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getSortIndicator = (active: boolean, direction: SortDirection): string => {
  if (!active) {
    return '';
  }
  return direction === 'asc' ? '▲' : '▼';
};

const ProjectsTableComponent = ({
  projects,
  onProjectClick,
  sortField,
  sortDirection,
  onSortChange,
  statusLabels,
  urgencyLabels,
  departmentLabels,
}: ProjectsTableProps): React.ReactElement => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>Gerencia solicitante</th>
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>Título</th>
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-900"
                onClick={() => onSortChange('score_weighted')}
              >
                Score
                <span aria-hidden="true">{getSortIndicator(sortField === 'score_weighted', sortDirection)}</span>
              </button>
            </th>
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>Impacto</th>
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>Frecuencia</th>
            <th className="px-4 py-3 border-r border-slate-200" rowSpan={2}>Urgencia</th>
            <th className="px-4 py-1 text-center border-b border-slate-200" colSpan={3}>Volumen (días hábiles)</th>
            <th className="px-4 py-3 border-l border-slate-200" rowSpan={2}>Estado</th>
            <th className="px-4 py-3" rowSpan={2}>Creado</th>
          </tr>
          <tr className="text-center text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
            <th className="px-2 py-2 border-r border-slate-200 bg-slate-50/50">Dev</th>
            <th className="px-2 py-2 border-r border-slate-200 bg-slate-50/50">Func</th>
            <th className="px-2 py-2 bg-slate-50/50">User</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {projects.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={11}>
                No se encontraron proyectos con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            projects.map((project) => {
              const hasImpactOverride = project.impact_score_considered !== null;
              const hasFrequencyOverride = project.frequency_score_considered !== null;
              const hasUrgencyOverride = project.urgency_level_considered !== null;

              const effectiveImpact = hasImpactOverride ? project.impact_score_considered : project.impact_score;
              const effectiveFrequency = hasFrequencyOverride ? project.frequency_score_considered : project.frequency_score;
              const effectiveUrgency = hasUrgencyOverride ? project.urgency_level_considered! : project.urgency_level;

              return (
                <tr
                  key={project.id}
                  className="cursor-pointer transition hover:bg-blue-50/50"
                  onClick={() => onProjectClick(project)}
                >
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {departmentLabels[project.requesting_department] ?? project.requesting_department}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{project.title}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">{formatNumber(project.score_weighted)}</td>
                  <td className="px-4 py-3 text-slate-600 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>{effectiveImpact}</span>
                      {hasImpactOverride && (
                        <span
                          className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-100 text-[8px] font-bold text-amber-700"
                          title={`Original: ${project.impact_score}`}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>{effectiveFrequency}</span>
                      {hasFrequencyOverride && (
                        <span
                          className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-100 text-[8px] font-bold text-amber-700"
                          title={`Original: ${project.frequency_score}`}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>{urgencyLabels[effectiveUrgency] ?? effectiveUrgency}</span>
                      {hasUrgencyOverride && (
                        <span
                          className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-100 text-[8px] font-bold text-amber-700"
                          title={`Original: ${urgencyLabels[project.urgency_level]}`}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Volumen Columns (Days) */}
                  <td className="px-2 py-3 text-center border-l border-slate-100">
                    <span className={typeof project.development_points === 'number' ? "font-bold text-slate-700" : "text-slate-300"}>
                      {typeof project.development_points === 'number' ? `${((project.development_points / 15) * 10).toFixed(1)}d` : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center border-l border-slate-100">
                    <span className={typeof project.functional_points === 'number' ? "font-bold text-slate-700" : "text-slate-300"}>
                      {typeof project.functional_points === 'number' ? `${((project.functional_points / 15) * 10).toFixed(1)}d` : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center border-l border-slate-100 border-r border-slate-100">
                    <span className={typeof project.user_points === 'number' ? "font-bold text-slate-700" : "text-slate-300"}>
                      {typeof project.user_points === 'number' ? `${((project.user_points / 15) * 10).toFixed(1)}d` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${project.status === 'new' ? 'bg-blue-50 text-blue-700' :
                      project.status === 'implemented' ? 'bg-green-50 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {statusLabels[project.status] ?? project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(project.created_at)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const ProjectsTable = memo(ProjectsTableComponent);
