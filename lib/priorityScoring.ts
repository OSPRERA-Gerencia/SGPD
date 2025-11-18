import { UrgencyLevel } from './types/database';

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

