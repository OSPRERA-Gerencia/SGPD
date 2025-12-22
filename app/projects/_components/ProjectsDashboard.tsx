'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProjectsRow, ProjectStatus, UrgencyLevel } from '@/lib/types/database';
import type { PriorityWeights } from '@/lib/priorityScoring';
import type { PriorityWeightsFormValues } from '@/lib/validation/priorityWeightsSchema';
import type { ProjectListSortField, SortDirection } from '@/lib/repositories/ProjectsRepository';
import {
  getProjectAllocationsAction,
  updateWeightsAndRecalculateScores,
  updateProjectDetailsAction,
  type ProjectAllocationSummary,
} from '../actions';
import { ProjectsTable } from './ProjectsTable';
import { PriorityWeightsPanel } from './PriorityWeightsPanel';
import { ProjectDetailSheet } from './ProjectDetailSheet';
import { ProjectEditModal } from './ProjectEditModal';

type ProjectsDashboardProps = {
  initialProjects: ProjectsRow[];
  initialWeights: PriorityWeights;
};

type DepartmentOption = {
  value: string;
  label: string;
};

type SaveWeightsResult = {
  success: boolean;
  error?: string;
};

const departmentLabels: Record<string, string> = {
  // Códigos en inglés (para compatibilidad con proyectos antiguos)
  intervention: 'Intervención',
  general_management: 'Gerencia General',
  medical_services: 'Gerencia de Prestaciones Médicas',
  administration_finance: 'Gerencia Administración y Finanzas',
  beneficiary_services: 'Gerencia Servicios a Beneficiarios',
  legal_affairs: 'Gerencia de Asuntos Jurídicos',
  human_resources: 'Gerencia de Recursos Humanos',
  purchasing: 'Gerencia de Compras',
  processes_systems: 'Gerencia Procesos y Sistemas',
  // Nombres en español (para proyectos nuevos)
  'Intervención': 'Intervención',
  'Gerencia General': 'Gerencia General',
  'Gerencia de Prestaciones Médicas': 'Gerencia de Prestaciones Médicas',
  'Gerencia Administración y Finanzas': 'Gerencia Administración y Finanzas',
  'Gerencia Servicios a Beneficiarios': 'Gerencia Servicios a Beneficiarios',
  'Gerencia de Asuntos Jurídicos': 'Gerencia de Asuntos Jurídicos',
  'Gerencia de Recursos Humanos': 'Gerencia de Recursos Humanos',
  'Gerencia de Compras': 'Gerencia de Compras',
  'Gerencia Procesos y Sistemas': 'Gerencia Procesos y Sistemas',
};

const statusLabels: Record<ProjectStatus, string> = {
  new: 'Nuevo',
  under_analysis: 'En análisis',
  prioritized: 'Priorizado',
  in_development: 'En desarrollo',
  in_testing: 'En testing',
  implemented: 'Implementado',
  maintenance: 'Mantenimiento',
  closed: 'Cerrado',
  rejected: 'Rechazado',
};

const urgencyLabels: Record<UrgencyLevel, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const getNumericValue = (value: number | string): number => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return numeric;
};

const parseScoreFilter = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric;
};

const formatSearchable = (value: string | null): string => value?.toLowerCase() ?? '';

export function ProjectsDashboard({ initialProjects, initialWeights }: ProjectsDashboardProps): React.ReactElement {
  const [projects, setProjects] = useState<ProjectsRow[]>(initialProjects);
  const [weights, setWeights] = useState<PriorityWeights>(initialWeights);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');

  const [sortField, setSortField] = useState<ProjectListSortField>('score_weighted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [selectedProject, setSelectedProject] = useState<ProjectsRow | null>(null);
  const [allocations, setAllocations] = useState<ProjectAllocationSummary[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState<boolean>(false);
  const [allocationsError, setAllocationsError] = useState<string | null>(null);

  const [isSavingWeights, setIsSavingWeights] = useState<boolean>(false);
  const [weightsError, setWeightsError] = useState<string | null>(null);

  const [editingProject, setEditingProject] = useState<ProjectsRow | null>(null);

  const departmentOptions = useMemo<DepartmentOption[]>(() => {
    const unique = new Set(
      projects
        .map((project) => project.requesting_department)
        .filter((value): value is string => Boolean(value)),
    );

    return Array.from(unique)
      .map((value) => ({
        value,
        label: departmentLabels[value] ?? value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const min = parseScoreFilter(minScore);
    const max = parseScoreFilter(maxScore);

    return projects.filter((project) => {
      if (selectedDepartment && project.requesting_department !== selectedDepartment) {
        return false;
      }

      if (selectedStatus && project.status !== selectedStatus) {
        return false;
      }

      if (normalizedSearch) {
        const title = formatSearchable(project.title);
        const shortDescription = formatSearchable(project.short_description);
        if (!title.includes(normalizedSearch) && !shortDescription.includes(normalizedSearch)) {
          return false;
        }
      }

      const weightedScore = getNumericValue(project.score_weighted);
      if (min !== null && weightedScore < min) {
        return false;
      }
      if (max !== null && weightedScore > max) {
        return false;
      }

      return true;
    });
  }, [projects, selectedDepartment, selectedStatus, searchTerm, minScore, maxScore]);

  const sortedProjects = useMemo(() => {
    const copy = [...filteredProjects];

    copy.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === 'score_weighted') {
        aValue = getNumericValue(a.score_weighted);
        bValue = getNumericValue(b.score_weighted);
      } else {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (aValue === bValue) {
        return 0;
      }

      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });

    return copy;
  }, [filteredProjects, sortField, sortDirection]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    let cancelled = false;
    setAllocationsLoading(true);
    setAllocationsError(null);

    getProjectAllocationsAction(selectedProject.id)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.success) {
          setAllocations([]);
          setAllocationsError(result.message);
          return;
        }
        setAllocations(result.allocations);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Error al cargar asignaciones.';
        setAllocationsError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setAllocationsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  const handleSortChange = (field: ProjectListSortField): void => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortDirection('desc');
      return field;
    });
  };

  const handleProjectClick = (project: ProjectsRow): void => {
    setEditingProject(project);
  };

  const handleSaveProjectDetails = async (projectId: string, updates: Partial<ProjectsRow>) => {
    const result = await updateProjectDetailsAction(projectId, updates);
    if (result.success) {
      // Update project in list
      setProjects(prev => prev.map(p => p.id === projectId ? result.project : p));
    } else {
      throw new Error(result.error);
    }
  };

  const handleCloseDetail = (): void => {
    setSelectedProject(null);
    setAllocations([]);
    setAllocationsError(null);
  };

  const handleSaveWeights = async (values: PriorityWeightsFormValues): Promise<SaveWeightsResult> => {
    setIsSavingWeights(true);
    setWeightsError(null);
    try {
      const result = await updateWeightsAndRecalculateScores(values);
      if (!result.success) {
        setWeightsError(result.formError);
        return { success: false, error: result.formError };
      }
      setWeights(result.weights);
      setProjects(result.projects);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar los pesos.';
      setWeightsError(message);
      return { success: false, error: message };
    } finally {
      setIsSavingWeights(false);
    }
  };

  const resetFilters = (): void => {
    setSelectedDepartment('');
    setSelectedStatus('');
    setSearchTerm('');
    setMinScore('');
    setMaxScore('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Backlog de proyectos</h1>
          <p className="mt-2 text-sm text-slate-600">
            Revisá los proyectos priorizados y ajustá los filtros para encontrar rápidamente lo que necesitás.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="departmentFilter">
                  Gerencia solicitante
                </label>
                <select
                  id="departmentFilter"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.currentTarget.value)}
                >
                  <option value="">Todas</option>
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="statusFilter">
                  Estado
                </label>
                <select
                  id="statusFilter"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.currentTarget.value as ProjectStatus | '')}
                >
                  <option value="">Todos</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="searchFilter">
                  Búsqueda
                </label>
                <input
                  id="searchFilter"
                  type="search"
                  placeholder="Título o descripción..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="minScore">
                    Score ponderado mín.
                  </label>
                  <input
                    id="minScore"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={minScore}
                    onChange={(event) => setMinScore(event.currentTarget.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="maxScore">
                    Score ponderado máx.
                  </label>
                  <input
                    id="maxScore"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={maxScore}
                    onChange={(event) => setMaxScore(event.currentTarget.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                Limpiar filtros
              </button>
            </div>
          </section>

          <ProjectsTable
            projects={sortedProjects}
            onProjectClick={handleProjectClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            statusLabels={statusLabels}
            urgencyLabels={urgencyLabels}
            departmentLabels={departmentLabels}
          />
        </div>

        <PriorityWeightsPanel
          weights={weights}
          onSave={handleSaveWeights}
          isSaving={isSavingWeights}
          serverError={weightsError}
          onClearServerError={() => setWeightsError(null)}
        />
      </div>

      <ProjectDetailSheet
        project={selectedProject}
        onClose={handleCloseDetail}
        allocations={allocations}
        loadingAllocations={allocationsLoading}
        allocationsError={allocationsError}
        statusLabels={statusLabels}
        urgencyLabels={urgencyLabels}
        departmentLabels={departmentLabels}
      />

      <ProjectEditModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleSaveProjectDetails}
        departmentLabels={departmentLabels}
      />
    </div>
  );
}

