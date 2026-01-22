import type { SportType } from './database.types';

// ============================================
// SCORING CONFIGURATION
// ============================================

export interface ScoringConfig {
  sport: SportType;
  setsToWin: number;
  gamesPerSet: number;
  tiebreakAt: number;
  finalSetTiebreak: boolean;
  finalSetTiebreakPoints: number;
  advantageScoring: boolean;
  pointsPerGame?: number; // For pickleball
  winByTwo: boolean;
  rallyScoring: boolean;
}

// Preset configurations
export const TENNIS_STANDARD: ScoringConfig = {
  sport: 'tennis',
  setsToWin: 2,
  gamesPerSet: 6,
  tiebreakAt: 6,
  finalSetTiebreak: true,
  finalSetTiebreakPoints: 10,
  advantageScoring: true,
  winByTwo: true,
  rallyScoring: false,
};

export const TENNIS_FAST4: ScoringConfig = {
  sport: 'tennis',
  setsToWin: 2,
  gamesPerSet: 4,
  tiebreakAt: 3,
  finalSetTiebreak: true,
  finalSetTiebreakPoints: 7,
  advantageScoring: false, // No advantage, sudden death deuce
  winByTwo: false,
  rallyScoring: false,
};

export const PICKLEBALL_STANDARD: ScoringConfig = {
  sport: 'pickleball',
  setsToWin: 2,
  gamesPerSet: 1,
  tiebreakAt: 0,
  finalSetTiebreak: false,
  finalSetTiebreakPoints: 0,
  advantageScoring: false,
  pointsPerGame: 11,
  winByTwo: true,
  rallyScoring: true,
};

export const PICKLEBALL_SIDEOUT: ScoringConfig = {
  sport: 'pickleball',
  setsToWin: 2,
  gamesPerSet: 1,
  tiebreakAt: 0,
  finalSetTiebreak: false,
  finalSetTiebreakPoints: 0,
  advantageScoring: false,
  pointsPerGame: 11,
  winByTwo: true,
  rallyScoring: false, // Traditional side-out scoring
};

// ============================================
// GAME STATE TYPES
// ============================================

export const TENNIS_POINTS = ['0', '15', '30', '40'] as const;
export type TennisPoint = (typeof TENNIS_POINTS)[number] | 'AD';

export interface TennisGameState {
  team1Points: TennisPoint;
  team2Points: TennisPoint;
}

export interface PickleballGameState {
  team1Points: number;
  team2Points: number;
  serverNumber: 1 | 2; // For doubles, which player on serving team
}

export type GameState = TennisGameState | PickleballGameState;

export interface SetState {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  isTiebreak: boolean;
  tiebreakScore: { team1: number; team2: number } | null;
  winner: 1 | 2 | null;
}

export interface MatchState {
  fixtureId: string;
  config: ScoringConfig;
  sets: SetState[];
  currentSetIndex: number;
  currentGame: GameState;
  servingTeam: 1 | 2;
  matchWinner: 1 | 2 | null;
  isComplete: boolean;
}

// ============================================
// SCORE EVENTS
// ============================================

export type ScoreEventType =
  | 'point_scored'
  | 'game_won'
  | 'set_won'
  | 'match_won'
  | 'undo'
  | 'correction'
  | 'match_started';

export interface ScoreEvent {
  id: string;
  fixtureId: string;
  eventType: ScoreEventType;
  scoringTeam: 1 | 2;
  scoreSnapshot: MatchState;
  recordedBy: string | null;
  recordedAt: Date;
  notes?: string;
}

// ============================================
// SCORING ENGINE INTERFACE
// ============================================

export interface ScoringEngine {
  scorePoint: (state: MatchState, scoringTeam: 1 | 2) => MatchState;
  undoLastPoint: (state: MatchState, events: ScoreEvent[]) => MatchState;
  isMatchComplete: (state: MatchState) => boolean;
  formatScore: (state: MatchState) => string;
  formatGameScore: (state: MatchState) => string;
  createInitialState: (fixtureId: string, config: ScoringConfig, servingTeam: 1 | 2) => MatchState;
}

// ============================================
// API PAYLOADS
// ============================================

export interface ScorePointRequest {
  fixtureId: string;
  scoringTeam: 1 | 2;
}

export interface ScorePointResponse {
  success: boolean;
  newState: MatchState;
  event: ScoreEvent;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ScoreboardProps {
  matchState: MatchState;
  team1Name: string;
  team2Name: string;
  isLive?: boolean;
}

export interface ScoringPanelProps {
  matchState: MatchState;
  team1Name: string;
  team2Name: string;
  onScorePoint: (team: 1 | 2) => void;
  onUndo: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export type Team = 1 | 2;

export function isTennisGameState(state: GameState): state is TennisGameState {
  return typeof state.team1Points === 'string';
}

export function isPickleballGameState(state: GameState): state is PickleballGameState {
  return typeof state.team1Points === 'number';
}
