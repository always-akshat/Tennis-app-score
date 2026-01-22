import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getScorer } from '../engine';
import type { MatchState, ScoringConfig, Team, ScoreEvent } from '@/types/scoring.types';
import type { Tables, SportType } from '@/types/database.types';

// ============================================
// QUERY KEYS
// ============================================

export const fixtureKeys = {
  all: ['fixtures'] as const,
  detail: (id: string) => [...fixtureKeys.all, id] as const,
  score: (id: string) => [...fixtureKeys.detail(id), 'score'] as const,
  events: (id: string) => [...fixtureKeys.detail(id), 'events'] as const,
};

// ============================================
// FETCH FIXTURE WITH SCORE
// ============================================

interface FixtureWithScore {
  fixture: Tables<'fixtures'>;
  matchScore: Tables<'match_scores'> | null;
  teams: Array<{
    id: string;
    position: 1 | 2;
    players: Array<{ id: string; displayName: string }>;
  }>;
  tournament: {
    sport: SportType;
    scoringConfig: ScoringConfig;
  };
}

export function useFixture(fixtureId: string) {
  return useQuery({
    queryKey: fixtureKeys.detail(fixtureId),
    queryFn: async (): Promise<FixtureWithScore> => {
      const { data: fixture, error } = await supabase
        .from('fixtures')
        .select(
          `
          *,
          match_score:match_scores(*),
          fixture_teams(
            id,
            team_position,
            fixture_team_players(
              player:players(id, display_name)
            )
          ),
          tournament:tournaments(sport, scoring_config)
        `
        )
        .eq('id', fixtureId)
        .single();

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixtureData = fixture as any;

      return {
        fixture: fixtureData,
        matchScore: fixtureData.match_score?.[0] ?? null,
        teams: fixtureData.fixture_teams.map((team: { id: string; team_position: number; fixture_team_players: Array<{ player: { id: string; display_name: string } }> }) => ({
          id: team.id,
          position: team.team_position as 1 | 2,
          players: team.fixture_team_players.map((ftp: { player: { id: string; display_name: string } }) => ({
            id: ftp.player.id,
            displayName: ftp.player.display_name,
          })),
        })),
        tournament: {
          sport: fixtureData.tournament.sport,
          scoringConfig: fixtureData.tournament.scoring_config as ScoringConfig,
        },
      };
    },
    enabled: !!fixtureId,
  });
}

// ============================================
// FETCH SCORE EVENTS (for undo)
// ============================================

export function useScoreEvents(fixtureId: string) {
  return useQuery({
    queryKey: fixtureKeys.events(fixtureId),
    queryFn: async (): Promise<ScoreEvent[]> => {
      const { data, error } = await supabase
        .from('score_events')
        .select('*')
        .eq('fixture_id', fixtureId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((event) => ({
        id: event.id,
        fixtureId: event.fixture_id,
        eventType: event.event_type as ScoreEvent['eventType'],
        scoringTeam: event.scoring_team as Team,
        scoreSnapshot: event.score_snapshot as unknown as MatchState,
        recordedBy: event.recorded_by,
        recordedAt: new Date(event.recorded_at),
        notes: event.notes ?? undefined,
      }));
    },
    enabled: !!fixtureId,
  });
}

// ============================================
// SCORE POINT MUTATION
// ============================================

interface ScorePointParams {
  fixtureId: string;
  scoringTeam: Team;
  currentState: MatchState;
}

export function useScorePoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fixtureId, scoringTeam, currentState }: ScorePointParams) => {
      const scorer = getScorer(currentState.config.sport);
      const newState = scorer.scorePoint(currentState, scoringTeam);

      // Update match_scores table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: scoreError } = await (supabase as any)
        .from('match_scores')
        .update({
          team1_sets_won: newState.sets.filter((s) => s.winner === 1).length,
          team2_sets_won: newState.sets.filter((s) => s.winner === 2).length,
          current_set_number: newState.currentSetIndex + 1,
          current_game_team1: newState.sets[newState.currentSetIndex].team1Games,
          current_game_team2: newState.sets[newState.currentSetIndex].team2Games,
          current_point_team1: String(newState.currentGame.team1Points),
          current_point_team2: String(newState.currentGame.team2Points),
          serving_team: newState.servingTeam,
          updated_at: new Date().toISOString(),
        })
        .eq('fixture_id', fixtureId);

      if (scoreError) throw scoreError;

      // Insert score event for audit trail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: eventError } = await (supabase as any).from('score_events').insert({
        fixture_id: fixtureId,
        event_type: 'point_scored',
        scoring_team: scoringTeam,
        score_snapshot: newState as unknown as Record<string, unknown>,
      });

      if (eventError) throw eventError;

      // Update fixture status if match started
      if (currentState.sets[0].team1Games === 0 && currentState.sets[0].team2Games === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('fixtures')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', fixtureId);
      }

      // Update fixture status if match completed
      if (newState.isComplete) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('fixtures')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', fixtureId);

        // Update winner
        const winnerTeamPosition = newState.matchWinner;
        if (winnerTeamPosition) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('fixture_teams')
            .update({ is_winner: true })
            .eq('fixture_id', fixtureId)
            .eq('team_position', winnerTeamPosition);
        }
      }

      return newState;
    },
    onSuccess: (_newState, { fixtureId }) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: fixtureKeys.detail(fixtureId) });
      queryClient.invalidateQueries({ queryKey: fixtureKeys.events(fixtureId) });
    },
  });
}

// ============================================
// UNDO MUTATION
// ============================================

export function useUndoPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fixtureId, events }: { fixtureId: string; events: ScoreEvent[] }) => {
      if (events.length === 0) {
        throw new Error('No events to undo');
      }

      const lastEvent = events[events.length - 1];
      const previousState =
        events.length > 1
          ? events[events.length - 2].scoreSnapshot
          : null;

      // Delete the last score event
      const { error: deleteError } = await supabase
        .from('score_events')
        .delete()
        .eq('id', lastEvent.id);

      if (deleteError) throw deleteError;

      // If there's a previous state, restore it
      if (previousState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('match_scores')
          .update({
            team1_sets_won: previousState.sets.filter((s) => s.winner === 1).length,
            team2_sets_won: previousState.sets.filter((s) => s.winner === 2).length,
            current_set_number: previousState.currentSetIndex + 1,
            current_game_team1: previousState.sets[previousState.currentSetIndex].team1Games,
            current_game_team2: previousState.sets[previousState.currentSetIndex].team2Games,
            current_point_team1: String(previousState.currentGame.team1Points),
            current_point_team2: String(previousState.currentGame.team2Points),
            serving_team: previousState.servingTeam,
            updated_at: new Date().toISOString(),
          })
          .eq('fixture_id', fixtureId);

        if (updateError) throw updateError;
      }

      return previousState;
    },
    onSuccess: (_, { fixtureId }) => {
      queryClient.invalidateQueries({ queryKey: fixtureKeys.detail(fixtureId) });
      queryClient.invalidateQueries({ queryKey: fixtureKeys.events(fixtureId) });
    },
  });
}

// ============================================
// REAL-TIME SUBSCRIPTION
// ============================================

export function useScoreSubscription(fixtureId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`fixture:${fixtureId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_scores',
          filter: `fixture_id=eq.${fixtureId}`,
        },
        () => {
          // Invalidate and refetch on any update
          queryClient.invalidateQueries({ queryKey: fixtureKeys.detail(fixtureId) });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'score_events',
          filter: `fixture_id=eq.${fixtureId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: fixtureKeys.events(fixtureId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fixtureId, queryClient]);
}

// ============================================
// BUILD MATCH STATE FROM DB
// ============================================

export function useMatchState(fixtureId: string): {
  matchState: MatchState | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: fixtureData, isLoading: fixtureLoading, error: fixtureError } = useFixture(fixtureId);
  const { data: events = [], isLoading: eventsLoading } = useScoreEvents(fixtureId);

  // Subscribe to real-time updates
  useScoreSubscription(fixtureId);

  const buildMatchState = useCallback((): MatchState | null => {
    if (!fixtureData) return null;

    const { tournament, matchScore } = fixtureData;
    const scorer = getScorer(tournament.sport);

    // If we have events, use the latest snapshot
    if (events.length > 0) {
      return events[events.length - 1].scoreSnapshot;
    }

    // Otherwise create initial state
    if (!matchScore) {
      return scorer.createInitialState(
        fixtureId,
        tournament.scoringConfig,
        1 // Default to team 1 serving
      );
    }

    // Build state from match_scores table (fallback)
    return scorer.createInitialState(
      fixtureId,
      tournament.scoringConfig,
      (matchScore.serving_team as Team) ?? 1
    );
  }, [fixtureData, events, fixtureId]);

  return {
    matchState: buildMatchState(),
    isLoading: fixtureLoading || eventsLoading,
    error: fixtureError as Error | null,
  };
}
