import { Link, useParams } from 'react-router-dom';
import {
  useFixture,
  useMatchState,
  useScorePoint,
  useUndoPoint,
  useScoreEvents,
} from '@/features/scoring/hooks/useScoring';
import { LiveScoreboard, ScoringPanel } from '@/features/scoring/components';
import { LoadingPage, ErrorMessage } from '@/components/common';
import type { Team } from '@/types/scoring.types';

export function ScorerPage() {
  const { slug, fixtureId } = useParams<{ slug: string; fixtureId: string }>();

  const { data: fixtureData, isLoading: fixtureLoading, error: fixtureError } = useFixture(fixtureId!);
  const { matchState, isLoading: stateLoading } = useMatchState(fixtureId!);
  const { data: events = [] } = useScoreEvents(fixtureId!);

  const scorePoint = useScorePoint();
  const undoPoint = useUndoPoint();

  if (fixtureLoading || stateLoading) return <LoadingPage />;

  if (fixtureError || !fixtureData || !matchState) {
    return (
      <ErrorMessage
        title="Match not found"
        message={fixtureError instanceof Error ? fixtureError.message : 'Could not load match'}
      />
    );
  }

  const { teams } = fixtureData;

  const team1 = teams.find((t) => t.position === 1);
  const team2 = teams.find((t) => t.position === 2);
  const team1Name = team1?.players.map((p) => p.displayName).join(' / ') || 'Team 1';
  const team2Name = team2?.players.map((p) => p.displayName).join(' / ') || 'Team 2';

  const handleScorePoint = (team: Team) => {
    scorePoint.mutate({
      fixtureId: fixtureId!,
      scoringTeam: team,
      currentState: matchState,
    });
  };

  const handleUndo = () => {
    if (events.length > 0) {
      undoPoint.mutate({
        fixtureId: fixtureId!,
        events,
      });
    }
  };

  const isLoading = scorePoint.isPending || undoPoint.isPending;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Back link */}
      <Link
        to={`/tournaments/${slug}/fixtures/${fixtureId}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to match
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">Live Scoring</h1>
        <p className="text-sm text-gray-600 mt-1">Tap a team to score a point</p>
      </div>

      {/* Scoreboard */}
      <LiveScoreboard
        matchState={matchState}
        team1Name={team1Name}
        team2Name={team2Name}
        isLive={!matchState.isComplete}
      />

      {/* Scoring panel */}
      <ScoringPanel
        matchState={matchState}
        team1Name={team1Name}
        team2Name={team2Name}
        onScorePoint={handleScorePoint}
        onUndo={handleUndo}
        disabled={matchState.isComplete}
        isLoading={isLoading}
        canUndo={events.length > 0}
      />

      {/* Error display */}
      {(scorePoint.error || undoPoint.error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {scorePoint.error?.message || undoPoint.error?.message}
        </div>
      )}
    </div>
  );
}
