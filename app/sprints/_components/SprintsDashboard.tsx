'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  allocatePointsToProjectAction,
  createOrUpdateSprintAction,
  getSprintDetailAction,
  type SprintDetail,
  type SprintSummary,
  updateSprintAllocationAction,
} from '../actions';
import type { ProjectsRow, SprintAllocationStatus, SprintStatus } from '@/lib/types/database';

type SprintsDashboardProps = {
  initialSummaries: SprintSummary[];
  initialDetail: SprintDetail | null;
};

type SprintFormState = {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  capacityPoints: string;
  notes: string;
  status: SprintStatus;
};

type AllocationFormState = {
  sprintId: string;
  allocationId?: string;
  projectId?: string;
  allocatedPoints: string;
  sprintStatus: SprintAllocationStatus;
  comments: string;
};

const SPRINT_STATUS_OPTIONS: Record<SprintStatus, string> = {
  planned: 'Planificado',
  ongoing: 'En curso',
  closed: 'Cerrado',
};

const ALLOCATION_STATUS_OPTIONS: Record<SprintAllocationStatus, string> = {
  planned: 'Planificado',
  in_progress: 'En progreso',
  done: 'Completado',
  carried_over: 'Trasladado',
};

const defaultSprintFormState: SprintFormState = {
  name: '',
  startDate: '',
  endDate: '',
  capacityPoints: '0',
  notes: '',
  status: 'planned',
};

const defaultAllocationFormState = (sprintId: string): AllocationFormState => ({
  sprintId,
  allocatedPoints: '0',
  sprintStatus: 'planned',
  comments: '',
});

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const calculateProgress = (allocated: number, capacity: number): number => {
  if (capacity <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((allocated / capacity) * 100));
};

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}): React.ReactElement => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:text-slate-900"
          aria-label="Cerrar modal"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  </div>
);

export function SprintsDashboard({ initialSummaries, initialDetail }: SprintsDashboardProps): React.ReactElement {
  const [summaries, setSummaries] = useState<SprintSummary[]>(initialSummaries);
  const [selectedDetail, setSelectedDetail] = useState<SprintDetail | null>(initialDetail);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(
    initialDetail?.summary.sprint.id ?? initialSummaries[0]?.sprint.id ?? null,
  );
  const [isLoadingDetail, startDetailTransition] = useTransition();

  const [isSprintModalOpen, setSprintModalOpen] = useState(false);
  const [sprintFormState, setSprintFormState] = useState<SprintFormState>(defaultSprintFormState);
  const [sprintFormError, setSprintFormError] = useState<string | null>(null);

  const [isAllocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationFormState, setAllocationFormState] = useState<AllocationFormState>(
    defaultAllocationFormState(selectedSprintId ?? ''),
  );
  const [allocationFormError, setAllocationFormError] = useState<string | null>(null);

  const [isSubmitting, startSubmitTransition] = useTransition();

  const currentSummary = useMemo(() => {
    if (!selectedSprintId) {
      return null;
    }
    return summaries.find((item) => item.sprint.id === selectedSprintId) ?? null;
  }, [selectedSprintId, summaries]);

  const handleSelectSprint = (sprintId: string): void => {
    if (selectedSprintId === sprintId) {
      return;
    }
    setSelectedSprintId(sprintId);
    startDetailTransition(() => {
      getSprintDetailAction(sprintId)
        .then((result) => {
          if (!result.success) {
            setSelectedDetail(null);
            return;
          }
          setSelectedDetail(result.detail);
        })
        .catch(() => {
          setSelectedDetail(null);
        });
    });
  };

  const openCreateSprintModal = (): void => {
    setSprintFormState(defaultSprintFormState);
    setSprintFormError(null);
    setSprintModalOpen(true);
  };

  const openEditSprintModal = (summary: SprintSummary): void => {
    setSprintFormState({
      id: summary.sprint.id,
      name: summary.sprint.name,
      startDate: summary.sprint.start_date,
      endDate: summary.sprint.end_date,
      capacityPoints: summary.sprint.capacity_points.toString(),
      notes: summary.sprint.notes ?? '',
      status: summary.sprint.status,
    });
    setSprintFormError(null);
    setSprintModalOpen(true);
  };

  const closeSprintModal = (): void => {
    setSprintModalOpen(false);
  };

  const handleSprintFieldChange = (field: keyof SprintFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSprintFormState((prev) => ({
      ...prev,
      [field]: event.currentTarget.value,
    }));
  };

  const handleSprintSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!selectedSprintId && !sprintFormState.id) {
      setSelectedSprintId(sprintFormState.id ?? null);
    }

    const formData = new FormData();
    if (sprintFormState.id) {
      formData.append('id', sprintFormState.id);
    }
    formData.append('name', sprintFormState.name);
    formData.append('startDate', sprintFormState.startDate);
    formData.append('endDate', sprintFormState.endDate);
    formData.append('capacityPoints', sprintFormState.capacityPoints);
    formData.append('notes', sprintFormState.notes ?? '');
    formData.append('status', sprintFormState.status);

    setSprintFormError(null);

    startSubmitTransition(() => {
      createOrUpdateSprintAction(formData)
        .then((result) => {
          if (!result.success) {
            setSprintFormError(result.error);
            return;
          }
          setSummaries(result.summaries);
          setSelectedDetail(result.detail);
          const newSelected = result.detail?.summary.sprint.id ?? null;
          setSelectedSprintId(newSelected);
          setSprintModalOpen(false);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Error al guardar el sprint.';
          setSprintFormError(message);
        });
    });
  };

  const openAllocationModalForProject = (project: ProjectsRow): void => {
    if (!selectedSprintId) {
      return;
    }
    setAllocationFormState({
      ...defaultAllocationFormState(selectedSprintId),
      projectId: project.id,
    });
    setAllocationFormError(null);
    setAllocationModalOpen(true);
  };

  const openAllocationModalForEdit = (allocation: SprintDetail['allocations'][number]): void => {
    setAllocationFormState({
      sprintId: allocation.sprint_id,
      allocationId: allocation.id,
      allocatedPoints: allocation.allocated_points.toString(),
      sprintStatus: allocation.sprint_status,
      comments: allocation.comments ?? '',
    });
    setAllocationFormError(null);
    setAllocationModalOpen(true);
  };

  const closeAllocationModal = (): void => {
    if (selectedSprintId) {
      setAllocationFormState(defaultAllocationFormState(selectedSprintId));
    }
    setAllocationModalOpen(false);
  };

  const handleAllocationFieldChange = (field: keyof AllocationFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAllocationFormState((prev) => ({
      ...prev,
      [field]: event.currentTarget.value,
    }));
  };

  const handleAllocationSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!selectedSprintId) {
      setAllocationFormError('Seleccioná un sprint primero.');
      return;
    }

    const payload = {
      sprintId: selectedSprintId,
      projectId: allocationFormState.projectId ?? '',
      allocatedPoints: Number(allocationFormState.allocatedPoints),
      sprintStatus: allocationFormState.sprintStatus,
      comments: allocationFormState.comments,
    };

    const isEditing = Boolean(allocationFormState.allocationId);

    setAllocationFormError(null);

    startSubmitTransition(() => {
      const promise = isEditing
        ? updateSprintAllocationAction({
            allocationId: allocationFormState.allocationId ?? '',
            allocatedPoints: Number(allocationFormState.allocatedPoints),
            sprintStatus: allocationFormState.sprintStatus,
            comments: allocationFormState.comments,
            sprintId: selectedSprintId,
          })
        : allocatePointsToProjectAction(payload);

      promise
        .then((result) => {
          if (!result.success) {
            setAllocationFormError(result.error);
            return;
          }
          setSummaries(result.summaries);
          setSelectedDetail(result.detail);
          setAllocationModalOpen(false);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Error al guardar la asignación.';
          setAllocationFormError(message);
        });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Gestión de sprints</h1>
          <p className="mt-2 text-sm text-slate-600">
            Administrá la capacidad disponible y asigná puntos a proyectos priorizados.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          onClick={openCreateSprintModal}
        >
          Nuevo sprint
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Sprints</h2>
          <div className="space-y-3">
            {summaries.length === 0 ? (
              <p className="text-sm text-slate-600">Todavía no hay sprints configurados.</p>
            ) : (
              summaries.map((summary) => {
                const progress = calculateProgress(summary.allocatedPoints, summary.sprint.capacity_points);
                const isActive = summary.sprint.id === selectedSprintId;
                return (
                  <button
                    key={summary.sprint.id}
                    type="button"
                    onClick={() => handleSelectSprint(summary.sprint.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{summary.sprint.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(summary.sprint.start_date)} - {formatDate(summary.sprint.end_date)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-600 hover:underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditSprintModal(summary);
                        }}
                      >
                        Editar
                      </button>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        {summary.allocatedPoints}/{summary.sprint.capacity_points} puntos
                      </span>
                      <span>{SPRINT_STATUS_OPTIONS[summary.sprint.status]}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="space-y-5">
          {selectedDetail ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedDetail.summary.sprint.name}</h2>
                    <p className="text-sm text-slate-600">
                      {formatDate(selectedDetail.summary.sprint.start_date)} –{' '}
                      {formatDate(selectedDetail.summary.sprint.end_date)}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>
                      Capacidad: <span className="font-semibold text-slate-900">{selectedDetail.summary.sprint.capacity_points}</span>
                    </p>
                    <p>
                      Asignados:{' '}
                      <span className="font-semibold text-slate-900">{selectedDetail.summary.allocatedPoints}</span>
                    </p>
                    <p>
                      Disponibles:{' '}
                      <span className="font-semibold text-slate-900">{selectedDetail.summary.availablePoints}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${calculateProgress(
                        selectedDetail.summary.allocatedPoints,
                        selectedDetail.summary.sprint.capacity_points,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Asignaciones</h3>
                  <p className="text-sm text-slate-500">
                    Estado general: {SPRINT_STATUS_OPTIONS[selectedDetail.summary.sprint.status]}
                  </p>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Proyecto</th>
                        <th className="px-4 py-2 text-left">Gerencia</th>
                        <th className="px-4 py-2 text-left">Score ponderado</th>
                        <th className="px-4 py-2 text-left">Puntos asignados</th>
                        <th className="px-4 py-2 text-left">Estado en sprint</th>
                        <th className="px-4 py-2 text-left">Comentarios</th>
                        <th className="px-4 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedDetail.allocations.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-center text-sm text-slate-500" colSpan={7}>
                            Todavía no hay asignaciones en este sprint.
                          </td>
                        </tr>
                      ) : (
                        selectedDetail.allocations.map((allocation) => {
                          const project = allocation.project;
                          return (
                            <tr key={allocation.id} className="text-slate-700">
                              <td className="px-4 py-2 font-medium text-slate-900">{project?.title ?? 'Proyecto desconocido'}</td>
                              <td className="px-4 py-2 text-sm">
                                {project?.requesting_department ?? '—'}
                              </td>
                              <td className="px-4 py-2 text-sm">{project?.score_weighted.toFixed(2) ?? '—'}</td>
                              <td className="px-4 py-2 text-sm">{allocation.allocated_points}</td>
                              <td className="px-4 py-2 text-sm">
                                {ALLOCATION_STATUS_OPTIONS[allocation.sprint_status]}
                              </td>
                              <td className="px-4 py-2 text-sm">{allocation.comments ?? '—'}</td>
                              <td className="px-4 py-2 text-sm">
                                <button
                                  type="button"
                                  className="text-sm font-medium text-blue-600 hover:underline"
                                  onClick={() => openAllocationModalForEdit(allocation)}
                                >
                                  Editar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Backlog disponible</h3>
                  <p className="text-sm text-slate-500">
                    Seleccioná un proyecto y asignale puntos en este sprint.
                  </p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Gerencia</th>
                        <th className="px-4 py-2 text-left">Título</th>
                        <th className="px-4 py-2 text-left">Score ponderado</th>
                        <th className="px-4 py-2 text-left">Estado</th>
                        <th className="px-4 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedDetail.backlog.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-center text-sm text-slate-500" colSpan={5}>
                            No hay proyectos disponibles para asignar en este sprint.
                          </td>
                        </tr>
                      ) : (
                        selectedDetail.backlog.map((project) => (
                          <tr key={project.id} className="text-slate-700">
                            <td className="px-4 py-2 text-sm">{project.requesting_department}</td>
                            <td className="px-4 py-2 font-medium text-slate-900">{project.title}</td>
                            <td className="px-4 py-2 text-sm">{project.score_weighted.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">{project.status}</td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                type="button"
                                className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onClick={() => openAllocationModalForProject(project)}
                              >
                                Asignar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {isLoadingDetail ? 'Cargando detalle del sprint...' : 'Seleccioná un sprint para ver el detalle.'}
            </div>
          )}
        </section>
      </div>

      {isSprintModalOpen ? (
        <Modal title={sprintFormState.id ? 'Editar sprint' : 'Nuevo sprint'} onClose={closeSprintModal}>
          <form className="space-y-4" onSubmit={handleSprintSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="sprint-name">
                Nombre
              </label>
              <input
                id="sprint-name"
                type="text"
                required
                value={sprintFormState.name}
                onChange={handleSprintFieldChange('name')}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sprint-start">
                  Fecha de inicio
                </label>
                <input
                  id="sprint-start"
                  type="date"
                  required
                  value={sprintFormState.startDate}
                  onChange={handleSprintFieldChange('startDate')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sprint-end">
                  Fecha de fin
                </label>
                <input
                  id="sprint-end"
                  type="date"
                  required
                  value={sprintFormState.endDate}
                  onChange={handleSprintFieldChange('endDate')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sprint-capacity">
                  Capacidad de puntos
                </label>
                <input
                  id="sprint-capacity"
                  type="number"
                  min="0"
                  required
                  value={sprintFormState.capacityPoints}
                  onChange={handleSprintFieldChange('capacityPoints')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sprint-status">
                  Estado
                </label>
                <select
                  id="sprint-status"
                  value={sprintFormState.status}
                  onChange={handleSprintFieldChange('status')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {Object.entries(SPRINT_STATUS_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="sprint-notes">
                Notas
              </label>
              <textarea
                id="sprint-notes"
                value={sprintFormState.notes}
                onChange={handleSprintFieldChange('notes')}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>

            {sprintFormError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{sprintFormError}</div>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                onClick={closeSprintModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isAllocationModalOpen ? (
        <Modal title={allocationFormState.allocationId ? 'Editar asignación' : 'Asignar proyecto'} onClose={closeAllocationModal}>
          <form className="space-y-4" onSubmit={handleAllocationSubmit}>
            {!allocationFormState.allocationId ? (
              <p className="text-sm text-slate-600">
                Asigná puntos al proyecto seleccionado en el sprint{' '}
                <span className="font-medium text-slate-900">{selectedDetail?.summary.sprint.name}</span>.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="allocation-points">
                  Puntos asignados
                </label>
                <input
                  id="allocation-points"
                  type="number"
                  min="0"
                  required
                  value={allocationFormState.allocatedPoints}
                  onChange={handleAllocationFieldChange('allocatedPoints')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="allocation-status">
                  Estado en sprint
                </label>
                <select
                  id="allocation-status"
                  value={allocationFormState.sprintStatus}
                  onChange={handleAllocationFieldChange('sprintStatus')}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {Object.entries(ALLOCATION_STATUS_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="allocation-comments">
                Comentarios
              </label>
              <textarea
                id="allocation-comments"
                value={allocationFormState.comments}
                onChange={handleAllocationFieldChange('comments')}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {allocationFormError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {allocationFormError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                onClick={closeAllocationModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

