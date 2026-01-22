import { Link, useParams } from 'react-router-dom';
import { useFixture, useScoreSubscription } from '@/features/scoring/hooks/useScoring';
import { LiveScoreboard } from '@/features/scoring/components';
import { getScorer } from '@/features/scoring/engine';
import { Button, Card, CardContent } from '@/components/ui';
import { LoadingPage, ErrorMessage } from '@/components/common';
import type { MatchState } from '@/types/scoring.types';

export function FixtureDetailPage() {
  const { slug, fixtureId } = useParams<{ slug: string; fixtureId: string }>();

  const { data, isLoading, error, refetch } = useFixture(fixtureId!);

  // Subscribe to real-time updates
  useScoreSubscription(fixtureId!);

  if (isLoading) return <LoadingPage />;

  if (error || !data) {
    return (
      <ErrorMessage
        title="Match not found"
        message={error instanceof Error ? error.message : 'Could not load match'}
        onRetry={() => refetch()}
      />
    );
  }

  const { fixture, teams, tournament, matchScore } = data;

  const team1 = teams.find((t) => t.position === 1);
  const team2 = teams.find((t) => t.position === 2);
  const team1Name = team1?.players.map((p) => p.displayName).join(' / ') || 'TBD';
  const team2Name = team2?.players.map((p) => p.displayName).join(' / ') || 'TBD';

  // Build match state from database
  const scorer = getScorer(tournament.sport);
  const matchState: MatchState = matchScore
    ? buildMatchStateFromDb(matchScore, tournament.scoringConfig, fixtureId!)
    : scorer.createInitialState(fixtureId!, tournament.scoringConfig, 1);

  const isLive = fixture.status === 'in_progress';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to={`/tournaments/${slug}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to tournament
      </Link>

      {/* Match header */}
      <div className="text-center">
        <p className="text-sm text-gray-500 uppercase mb-1">
          {tournament.sport} - Round {fixture.round_number}
        </p>
        {fixture.court_name && (
          <p className="text-sm text-gray-600">{fixture.court_name}</p>
        )}
      </div>

      {/* Live scoreboard */}
      <LiveScoreboard
        matchState={matchState}
        team1Name={team1Name}
        team2Name={team2Name}
        isLive={isLive}
      />

      {/* Match info */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium text-gray-900">
                {fixture.status.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Format</div>
              <div className="font-medium text-gray-900">
                Best of {tournament.scoringConfig.setsToWin * 2 - 1}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorer link (only if match can be scored) */}
      {(fixture.status === 'scheduled' || fixture.status === 'in_progress') && (
        <div className="text-center">
          <Link to={`/tournaments/${slug}/fixtures/${fixtureId}/score`}>
            <Button size="lg">
              {fixture.status === 'scheduled' ? 'Start Match' : 'Continue Scoring'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper to build MatchState from database record
function buildMatchStateFromDb(
  matchScore: {
    team1_sets_won: number;
    team2_sets_won: number;
    current_set_number: number;
    current_game_team1: number;
    current_game_team2: number;
    current_point_team1: string;
    current_point_team2: string;
    serving_team: 1 | 2 | null;
  },
  config: MatchState['config'],
  fixtureId: string
): MatchState {
  // This is a simplified reconstruction - in production, you'd use the score_events
  const sets = [];
  const totalSets = matchScore.team1_sets_won + matchScore.team2_sets_won;

  for (let i = 0; i < Math.max(totalSets, 1); i++) {
    sets.push({
      setNumber: i + 1,
      team1Games: i === matchScore.current_set_number - 1 ? matchScore.current_game_team1 : 6,
      team2Games: i === matchScore.current_set_number - 1 ? matchScore.current_game_team2 : 4,
      isTiebreak: false,
      tiebreakScore: null,
      winner: i < matchScore.current_set_number - 1 ? (i % 2 === 0 ? 1 : 2) as 1 | 2 : null,
    });
  }

  // Add current set if needed
  if (sets.length < matchScore.current_set_number) {
    sets.push({
      setNumber: matchScore.current_set_number,
      team1Games: matchScore.current_game_team1,
      team2Games: matchScore.current_game_team2,
      isTiebreak: false,
      tiebreakScore: null,
      winner: null,
    });
  }

  const isComplete =
    matchScore.team1_sets_won === config.setsToWin ||
    matchScore.team2_sets_won === config.setsToWin;

  return {
    fixtureId,
    config,
    sets,
    currentSetIndex: matchScore.current_set_number - 1,
    currentGame: {
      team1Points: matchScore.current_point_team1 as '0' | '15' | '30' | '40' | 'AD',
      team2Points: matchScore.current_point_team2 as '0' | '15' | '30' | '40' | 'AD',
    },
    servingTeam: matchScore.serving_team ?? 1,
    matchWinner: isComplete
      ? matchScore.team1_sets_won > matchScore.team2_sets_won
        ? 1
        : 2
      : null,
    isComplete,
  };
}
