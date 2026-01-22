// Re-export all types for convenience
export * from './database.types';
export * from './scoring.types';

// ============================================
// DOMAIN TYPES (derived from database types)
// ============================================

import type { Tables } from './database.types';
import type { ScoringConfig } from './scoring.types';

export type Organisation = Tables<'organisations'>;
export type Player = Tables<'players'>;
export type OrganisationMember = Tables<'organisation_members'>;
export type Tournament = Tables<'tournaments'>;
export type TournamentPlayer = Tables<'tournament_players'>;
export type Fixture = Tables<'fixtures'>;
export type FixtureTeam = Tables<'fixture_teams'>;
export type FixtureTeamPlayer = Tables<'fixture_team_players'>;
export type MatchScore = Tables<'match_scores'>;
export type SetScore = Tables<'set_scores'>;
export type ScoreEventRow = Tables<'score_events'>;

// ============================================
// ENRICHED TYPES (with relationships)
// ============================================

export interface FixtureTeamWithPlayers extends FixtureTeam {
  players: Player[];
}

export interface FixtureWithDetails extends Fixture {
  teams: FixtureTeamWithPlayers[];
  match_score: MatchScore | null;
}

export interface TournamentWithDetails extends Tournament {
  organisation: Organisation;
  fixtures: FixtureWithDetails[];
  players: TournamentPlayerWithDetails[];
  scoringConfig: ScoringConfig;
}

export interface TournamentPlayerWithDetails extends TournamentPlayer {
  player: Player;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateTournamentInput {
  organisationId: string;
  name: string;
  sport: Tournament['sport'];
  format: Tournament['format'];
  isDoubles: boolean;
  scoringConfig?: Partial<ScoringConfig>;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
}

export interface UpdateTournamentInput {
  name?: string;
  status?: Tournament['status'];
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
}
