import type { SportType } from '@/types/database.types';
import type { ScoringEngine } from '@/types/scoring.types';
import { tennisScorer } from './tennis';
import { pickleballScorer } from './pickleball';

const scorers: Record<SportType, ScoringEngine> = {
  tennis: tennisScorer,
  pickleball: pickleballScorer,
  badminton: tennisScorer, // Use tennis scorer as base for now
  padel: tennisScorer, // Use tennis scorer as base for now
};

export function getScorer(sport: SportType): ScoringEngine {
  return scorers[sport];
}

export { tennisScorer, pickleballScorer };
export type { ScoringEngine };
