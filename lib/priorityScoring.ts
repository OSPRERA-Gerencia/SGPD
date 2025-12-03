import { UrgencyLevel } from './types/database';
import type { ProjectsRow } from './types/database';

export type PriorityInputs = {
  impactScore: number;
  frequencyScore: number;
  urgencyLevel: UrgencyLevel;
};

export type PriorityWeights = {
  impactWeight: number;
  frequencyWeight: number;
  urgencyWeight: number;
};

export type RawScoreInputs = {
  impactScore: number;
  frequencyScore: number;
  urgencyScore: number;
};

export const mapUrgencyToScore = (level: UrgencyLevel): number => {
  switch (level) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      // Esto ayuda a que TypeScript asegure que se cubren todos los casos
      const exhaustiveCheck: never = level;
      throw new Error(`Nivel de urgencia desconocido: ${exhaustiveCheck}`);
  }
};

export const calculateRawScore = ({ impactScore, frequencyScore, urgencyScore }: RawScoreInputs): number => {
  return impactScore + frequencyScore + urgencyScore;
};

export const calculateWeightedScore = (priorityInputs: PriorityInputs, weights: PriorityWeights): number => {
  const urgencyScore = mapUrgencyToScore(priorityInputs.urgencyLevel);
  return (
    priorityInputs.impactScore * weights.impactWeight +
    priorityInputs.frequencyScore * weights.frequencyWeight +
    urgencyScore * weights.urgencyWeight
  );
};

/**
 * Gets the effective impact score (uses considered value if set, otherwise original)
 */
export const getEffectiveImpactScore = (project: ProjectsRow): number => {
  return project.impact_score_considered ?? project.impact_score;
};

/**
 * Gets the effective frequency score (uses considered value if set, otherwise original)
 */
export const getEffectiveFrequencyScore = (project: ProjectsRow): number => {
  return project.frequency_score_considered ?? project.frequency_score;
};

/**
 * Gets the effective urgency level (uses considered value if set, otherwise original)
 */
export const getEffectiveUrgencyLevel = (project: ProjectsRow): UrgencyLevel => {
  return project.urgency_level_considered ?? project.urgency_level;
};

/**
 * Gets the effective weights for a project (uses custom weights if set, otherwise global)
 */
export const getEffectiveWeights = (project: ProjectsRow, globalWeights: PriorityWeights): PriorityWeights => {
  return {
    impactWeight: project.custom_impact_weight ?? globalWeights.impactWeight,
    frequencyWeight: project.custom_frequency_weight ?? globalWeights.frequencyWeight,
    urgencyWeight: project.custom_urgency_weight ?? globalWeights.urgencyWeight,
  };
};

/**
 * Checks if a project has any override values set
 */
export const hasOverrideValues = (project: ProjectsRow): boolean => {
  return (
    project.impact_score_considered !== null ||
    project.frequency_score_considered !== null ||
    project.urgency_level_considered !== null
  );
};

/**
 * Checks if a project has custom weights set
 */
export const hasCustomWeights = (project: ProjectsRow): boolean => {
  return (
    project.custom_impact_weight !== null ||
    project.custom_frequency_weight !== null ||
    project.custom_urgency_weight !== null
  );
};

/**
 * Calculates the weighted score for a project using effective values and weights
 */
export const calculateProjectWeightedScore = (project: ProjectsRow, globalWeights: PriorityWeights): number => {
  const effectiveWeights = getEffectiveWeights(project, globalWeights);
  const priorityInputs: PriorityInputs = {
    impactScore: getEffectiveImpactScore(project),
    frequencyScore: getEffectiveFrequencyScore(project),
    urgencyLevel: getEffectiveUrgencyLevel(project),
  };
  return calculateWeightedScore(priorityInputs, effectiveWeights);
};

