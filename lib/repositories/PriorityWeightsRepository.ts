import { isSupabaseConfigured, supabaseServerClient } from '../supabaseClient';
import type { PriorityWeightsRow, TypedSupabaseClient } from '../types/database';
import type { PriorityWeights } from '../priorityScoring';
import { memoryPriorityWeights } from './inMemoryStore';

const SUM_EPSILON = 1e-6;

const getClient = (): TypedSupabaseClient => supabaseServerClient() as TypedSupabaseClient;

const toPriorityWeights = (row: Pick<PriorityWeightsRow, 'impact_weight' | 'frequency_weight' | 'urgency_weight'>): PriorityWeights => ({
  impactWeight: row.impact_weight,
  frequencyWeight: row.frequency_weight,
  urgencyWeight: row.urgency_weight,
});

const assertWeightsSum = (weights: PriorityWeights): void => {
  const total = weights.impactWeight + weights.frequencyWeight + weights.urgencyWeight;
  if (Math.abs(total - 1) > SUM_EPSILON) {
    throw new Error('Los pesos de prioridad deben sumar 1.');
  }
};

export class PriorityWeightsRepository {
  static async getActiveWeights(): Promise<PriorityWeights> {
    if (!isSupabaseConfigured()) {
      return memoryPriorityWeights.getActiveWeights();
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('priority_weights')
      .select('impact_weight, frequency_weight, urgency_weight')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener pesos de prioridad activos: ${error.message}`);
    }

    if (!data) {
      throw new Error('No existen pesos de prioridad activos configurados.');
    }

    return toPriorityWeights(data);
  }

  static async updateActiveWeights(newWeights: PriorityWeights): Promise<PriorityWeights> {
    assertWeightsSum(newWeights);

    if (!isSupabaseConfigured()) {
      return memoryPriorityWeights.updateActiveWeights(newWeights);
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('priority_weights')
      // @ts-expect-error - Supabase types issue in build
      .update({
        impact_weight: newWeights.impactWeight,
        frequency_weight: newWeights.frequencyWeight,
        urgency_weight: newWeights.urgencyWeight,
      })
      .eq('is_active', true)
      .select('impact_weight, frequency_weight, urgency_weight')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar los pesos de prioridad: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se encontró configuración activa de pesos para actualizar.');
    }

    return toPriorityWeights(data);
  }
}

