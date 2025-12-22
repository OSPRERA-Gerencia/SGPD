'use client';

import { useState } from 'react';
import type { ProjectsRow, ProjectStatus, UrgencyLevel } from '@/lib/types/database';
import { getPointsConversionTable } from '@/lib/pointsConversion';

type ProjectEditModalProps = {
    project: ProjectsRow | null;
    onClose: () => void;
    onSave: (projectId: string, updates: Partial<ProjectsRow>) => Promise<void>;
    departmentLabels?: Record<string, string>;
};

const urgencyOptions: Array<{ value: UrgencyLevel; label: string }> = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
    { value: 'new', label: 'Nuevo' },
    { value: 'under_analysis', label: 'En análisis' },
    { value: 'prioritized', label: 'Priorizado (Listo para Sprint)' },
    { value: 'in_development', label: 'En desarrollo' },
    { value: 'in_testing', label: 'En testing' },
    { value: 'implemented', label: 'Implementado' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'closed', label: 'Cerrado' },
    { value: 'rejected', label: 'Rechazado' },
];

export function ProjectEditModal({ project, onClose, onSave, departmentLabels = {} }: ProjectEditModalProps): React.ReactElement | null {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Override values
    const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'new');
    const [impactConsidered, setImpactConsidered] = useState<number | null>(project?.impact_score_considered ?? null);
    const [frequencyConsidered, setFrequencyConsidered] = useState<number | null>(project?.frequency_score_considered ?? null);
    const [urgencyConsidered, setUrgencyConsidered] = useState<UrgencyLevel | null>(project?.urgency_level_considered ?? null);

    // Development points
    const [developmentPoints, setDevelopmentPoints] = useState<number | null>(project?.development_points ?? null);
    const [functionalPoints, setFunctionalPoints] = useState<number | null>(project?.functional_points ?? null);
    const [userPoints, setUserPoints] = useState<number | null>(project?.user_points ?? null);

    // New frequency fields
    const [frequencyNumber, setFrequencyNumber] = useState<number>(project?.frequency_number ?? 1);
    const [frequencyUnit, setFrequencyUnit] = useState<string>(project?.frequency_unit ?? 'week');
    const [contactDepartment, setContactDepartment] = useState<string>(project?.contact_department ?? '');
    const [contactName, setContactName] = useState<string>(project?.contact_name ?? '');
    const [contactEmail, setContactEmail] = useState<string>(project?.contact_email ?? '');
    const [contactPhone, setContactPhone] = useState<string>(project?.contact_phone ?? '');

    if (!project) return null;

    const conversionTable = getPointsConversionTable();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            // Check if any override values are being set
            const hasOverrides = impactConsidered !== null || frequencyConsidered !== null || urgencyConsidered !== null;

            await onSave(project.id, {
                status,
                impact_score_considered: impactConsidered,
                frequency_score_considered: frequencyConsidered,
                urgency_level_considered: urgencyConsidered,
                development_points: developmentPoints,
                functional_points: functionalPoints,
                user_points: userPoints,
                // Structured data
                frequency_number: frequencyNumber,
                frequency_unit: frequencyUnit,
                contact_department: contactDepartment,
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                // Mark as reviewed if override values are set
                is_reviewed_by_team: hasOverrides,
                reviewed_at: hasOverrides ? new Date().toISOString() : null,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-900">Editar Proyecto</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 transition hover:text-slate-600"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project Info & Details */}
                    <div className="rounded-lg bg-slate-50 p-4">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900">{project.title}</h3>
                                <p className="text-sm text-slate-600">{project.short_description}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Solicitado por: <span className="font-medium">{departmentLabels[project.requesting_department] ?? project.requesting_department}</span>
                                </p>
                            </div>
                            <div className="min-w-[200px]">
                                <label className="text-xs font-medium text-slate-500">Estado</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Toggle Details */}
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            {showDetails ? 'Ocultar detalles de la solicitud' : 'Ver detalles de la solicitud'}
                            <svg
                                className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDetails && (
                            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900">Problema</h4>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{project.problem_description}</p>
                                </div>
                                {project.context && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900">Contexto</h4>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{project.context}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900">Impacto (Original: {project.impact_score})</h4>
                                        <p className="mt-1 text-sm text-slate-600">{project.impact_description ?? 'Sin descripción'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900">Frecuencia (Original: {project.frequency_score})</h4>
                                        <p className="mt-1 text-sm text-slate-600">{project.frequency_description ?? 'Sin descripción'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900">Dependencias</h4>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {project.has_external_dependencies ? 'Sí' : 'No'}
                                        {project.dependencies_detail && ` - ${project.dependencies_detail}`}
                                    </p>
                                    {project.other_departments_involved && (
                                        <p className="mt-1 text-sm text-slate-600">
                                            <span className="font-medium">Otras áreas:</span> {project.other_departments_involved}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900">Usuario</h4>
                                    <div className="mt-1 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400">Nombre</label>
                                            <input
                                                type="text"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400">Gerencia</label>
                                            <select
                                                value={contactDepartment}
                                                onChange={(e) => setContactDepartment(e.target.value)}
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                            >
                                                {Object.entries(departmentLabels).map(([val, lab]) => (
                                                    <option key={val} value={val}>{lab}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400">Email</label>
                                            <input
                                                type="email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400">Teléfono</label>
                                            <input
                                                type="text"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Override Values Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">Valores Considerados</h3>
                        <p className="mb-4 text-sm text-slate-600">
                            Sobrescribí los valores ingresados por el solicitante con los valores que el equipo de review considera correctos.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* Impact */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Impacto
                                    <span className="ml-2 text-xs text-slate-500">(Original: {project.impact_score})</span>
                                </label>
                                <select
                                    value={impactConsidered ?? ''}
                                    onChange={(e) => setImpactConsidered(e.target.value ? Number(e.target.value) : null)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Usar original ({project.impact_score})</option>
                                    <option value="1">1 - Muy bajo</option>
                                    <option value="2">2 - Bajo</option>
                                    <option value="3">3 - Medio</option>
                                    <option value="4">4 - Alto</option>
                                    <option value="5">5 - Muy alto</option>
                                </select>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Frecuencia (Actual: {project.frequency_score})
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={frequencyNumber}
                                        onChange={(e) => setFrequencyNumber(Number(e.target.value))}
                                        className="mt-1 w-20 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                    />
                                    <select
                                        value={frequencyUnit}
                                        onChange={(e) => setFrequencyUnit(e.target.value)}
                                        className="mt-1 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                    >
                                        <option value="day">Día</option>
                                        <option value="week">Semana</option>
                                        <option value="month">Mes</option>
                                    </select>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Score sugerido: {(() => {
                                        if (frequencyUnit === 'day') return frequencyNumber > 1 ? 5 : 4;
                                        if (frequencyUnit === 'week') return frequencyNumber >= 1 ? 3 : 2;
                                        if (frequencyUnit === 'month') return frequencyNumber >= 4 ? 4 : (frequencyNumber >= 2 ? 2 : 1);
                                        return 1;
                                    })()}
                                </p>
                                <select
                                    value={frequencyConsidered ?? ''}
                                    onChange={(e) => setFrequencyConsidered(e.target.value ? Number(e.target.value) : null)}
                                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Usar calculado</option>
                                    <option value="1">1 - Muy baja</option>
                                    <option value="2">2 - Baja</option>
                                    <option value="3">3 - Media</option>
                                    <option value="4">4 - Alta</option>
                                    <option value="5">5 - Muy alta</option>
                                </select>
                            </div>

                            {/* Urgency */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Urgencia
                                    <span className="ml-2 text-xs text-slate-500">(Original: {project.urgency_level})</span>
                                </label>
                                <select
                                    value={urgencyConsidered ?? ''}
                                    onChange={(e) => setUrgencyConsidered((e.target.value as UrgencyLevel) || null)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Usar original ({project.urgency_level})</option>
                                    {urgencyOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Size Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">Tamaño del Proyecto</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Puntos de Desarrollo</label>
                                <select
                                    value={developmentPoints ?? ''}
                                    onChange={(e) => setDevelopmentPoints(e.target.value !== '' ? Number(e.target.value) : null)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Sin definir</option>
                                    <option value="0">0 puntos</option>
                                    {[...Array(15)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'punto' : 'puntos'}</option>
                                    ))}
                                </select>
                                {developmentPoints !== null && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        Tiempo estimado: {(() => {
                                            if (developmentPoints === 0) return 'N/A';
                                            const days = (developmentPoints / 15) * 10;
                                            if (days < 5) return `~${days.toFixed(1)} días`;
                                            return `~${(days / 5).toFixed(1)} semanas`;
                                        })()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Puntos Funcionales</label>
                                <select
                                    value={functionalPoints ?? ''}
                                    onChange={(e) => setFunctionalPoints(e.target.value !== '' ? Number(e.target.value) : null)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Sin definir</option>
                                    <option value="0">0 puntos</option>
                                    {[...Array(15)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'punto' : 'puntos'}</option>
                                    ))}
                                </select>
                                {functionalPoints !== null && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        Tiempo estimado: {(() => {
                                            if (functionalPoints === 0) return 'N/A';
                                            const days = (functionalPoints / 15) * 10;
                                            if (days < 5) return `~${days.toFixed(1)} días`;
                                            return `~${(days / 5).toFixed(1)} semanas`;
                                        })()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Puntos de Usuario</label>
                                <select
                                    value={userPoints ?? ''}
                                    onChange={(e) => setUserPoints(e.target.value !== '' ? Number(e.target.value) : null)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Sin definir</option>
                                    <option value="0">0 puntos</option>
                                    {[...Array(15)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'punto' : 'puntos'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Conversion Table */}
                        <div className="mt-4">
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Tabla de Referencia (Desarrollo/Funcional)</h4>
                            <div className="rounded-md border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Puntos</th>
                                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Tiempo Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {conversionTable.slice(0, 5).map((row) => (
                                            <tr key={row.points}>
                                                <td className="px-3 py-2 text-slate-700">{row.points}</td>
                                                <td className="px-3 py-2 text-slate-700">{row.label}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50">
                                            <td className="px-3 py-2 font-semibold text-blue-900">15</td>
                                            <td className="px-3 py-2 font-semibold text-blue-900">2.0 semanas (Referencia)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
