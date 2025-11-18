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
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase text-slate-600">
            <th className="px-4 py-3">Gerencia solicitante</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-600 transition hover:text-slate-900"
                onClick={() => onSortChange('score_raw')}
              >
                Score crudo
                <span aria-hidden="true">{getSortIndicator(sortField === 'score_raw', sortDirection)}</span>
              </button>
            </th>
            <th className="px-4 py-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-600 transition hover:text-slate-900"
                onClick={() => onSortChange('score_weighted')}
              >
                Score ponderado
                <span aria-hidden="true">{getSortIndicator(sortField === 'score_weighted', sortDirection)}</span>
              </button>
            </th>
            <th className="px-4 py-3">Impacto</th>
            <th className="px-4 py-3">Frecuencia</th>
            <th className="px-4 py-3">Urgencia</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Creado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {projects.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={9}>
                No se encontraron proyectos con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                className="cursor-pointer transition hover:bg-blue-50"
                onClick={() => onProjectClick(project)}
              >
                <td className="px-4 py-3 text-slate-700">
                  {departmentLabels[project.requesting_department] ?? project.requesting_department}
                </td>
                <td className="px-4 py-3 text-slate-900">{project.title}</td>
                <td className="px-4 py-3 text-slate-700">{formatNumber(project.score_raw)}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">{formatNumber(project.score_weighted)}</td>
                <td className="px-4 py-3 text-slate-700">{project.impact_score.toString()}</td>
                <td className="px-4 py-3 text-slate-700">{project.frequency_score.toString()}</td>
                <td className="px-4 py-3 text-slate-700">
                  {urgencyLabels[project.urgency_level] ?? project.urgency_level}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {statusLabels[project.status] ?? project.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDate(project.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const ProjectsTable = memo(ProjectsTableComponent);

