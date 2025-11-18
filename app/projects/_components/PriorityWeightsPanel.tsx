'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PriorityWeights } from '@/lib/priorityScoring';
import type { PriorityWeightsFormValues } from '@/lib/validation/priorityWeightsSchema';

type SaveWeightsResult = {
  success: boolean;
  error?: string;
};

export type PriorityWeightsPanelProps = {
  weights: PriorityWeights;
  onSave: (values: PriorityWeightsFormValues) => Promise<SaveWeightsResult>;
  isSaving: boolean;
  serverError: string | null;
  onClearServerError: () => void;
};

type FormState = {
  impactWeight: string;
  frequencyWeight: string;
  urgencyWeight: string;
};

const toFormState = (weights: PriorityWeights): FormState => ({
  impactWeight: weights.impactWeight.toString(),
  frequencyWeight: weights.frequencyWeight.toString(),
  urgencyWeight: weights.urgencyWeight.toString(),
});

const parseWeight = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

export function PriorityWeightsPanel({
  weights,
  onSave,
  isSaving,
  serverError,
  onClearServerError,
}: PriorityWeightsPanelProps): React.ReactElement {
  const [formValues, setFormValues] = useState<FormState>(() => toFormState(weights));
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(toFormState(weights));
  }, [weights]);

  useEffect(() => {
    if (serverError) {
      setLocalError(serverError);
    }
  }, [serverError]);

  const total = useMemo(() => {
    const impact = parseWeight(formValues.impactWeight) ?? 0;
    const frequency = parseWeight(formValues.frequencyWeight) ?? 0;
    const urgency = parseWeight(formValues.urgencyWeight) ?? 0;
    return impact + frequency + urgency;
  }, [formValues]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    setLocalError(null);
    setSuccessMessage(null);
    if (serverError) {
      onClearServerError();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    const impactWeight = parseWeight(formValues.impactWeight);
    const frequencyWeight = parseWeight(formValues.frequencyWeight);
    const urgencyWeight = parseWeight(formValues.urgencyWeight);

    if (impactWeight === null || frequencyWeight === null || urgencyWeight === null) {
      setLocalError('Ingresá valores numéricos válidos para los pesos.');
      return;
    }

    const values: PriorityWeightsFormValues = {
      impactWeight,
      frequencyWeight,
      urgencyWeight,
    };

    const result = await onSave(values);

    if (!result.success) {
      setLocalError(result.error ?? 'No se pudieron actualizar los pesos.');
      return;
    }

    setSuccessMessage('Pesos actualizados correctamente.');
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Configuración de prioridad</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajustá los pesos para calcular el score ponderado. Deben sumar 1.
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="impactWeight">
              Peso impacto
            </label>
            <input
              id="impactWeight"
              type="number"
              min="0"
              max="1"
              step="0.05"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formValues.impactWeight}
              onChange={handleChange('impactWeight')}
              aria-describedby="impactWeight-help"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="frequencyWeight">
              Peso frecuencia
            </label>
            <input
              id="frequencyWeight"
              type="number"
              min="0"
              max="1"
              step="0.05"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formValues.frequencyWeight}
              onChange={handleChange('frequencyWeight')}
              aria-describedby="frequencyWeight-help"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="urgencyWeight">
              Peso urgencia
            </label>
            <input
              id="urgencyWeight"
              type="number"
              min="0"
              max="1"
              step="0.05"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formValues.urgencyWeight}
              onChange={handleChange('urgencyWeight')}
              aria-describedby="urgencyWeight-help"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p id="impactWeight-help" className="text-sm text-slate-600">
            Suma total: <span className="font-semibold">{total.toFixed(2)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => {
                setFormValues(toFormState(weights));
                setLocalError(null);
                setSuccessMessage(null);
                onClearServerError();
              }}
            >
              Restablecer
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar pesos'}
            </button>
          </div>
        </div>

        {localError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError}</div>
        ) : null}

        {successMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
        ) : null}
      </form>
    </section>
  );
}

