import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui';
import { LoadingPage, ErrorMessage } from '@/components/common';
import type { FixtureWithDetails, TournamentWithDetails } from '@/types';

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: tournament,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tournaments', slug],
    queryFn: async (): Promise<TournamentWithDetails> => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          organisation:organisations(*),
          fixtures:fixtures(
            *,
            teams:fixture_teams(
              *,
              players:fixture_team_players(
                player:players(*)
              )
            ),
            match_score:match_scores(*)
          )
        `
        )
        .eq('slug', slug!)
        .single();

      if (error) throw error;
      return data as unknown as TournamentWithDetails;
    },
    enabled: !!slug,
  });

  if (isLoading) return <LoadingPage />;

  if (error || !tournament) {
    return (
      <ErrorMessage
        title="Tournament not found"
        message={error instanceof Error ? error.message : 'Could not load tournament'}
        onRetry={() => refetch()}
      />
    );
  }

  const statusColors = {
    registration: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-yellow-100 text-yellow-800',
  };

  // Group fixtures by round
  const fixturesByRound = tournament.fixtures?.reduce(
    (acc, fixture) => {
      const round = fixture.round_number;
      if (!acc[round]) acc[round] = [];
      acc[round].push(fixture as FixtureWithDetails);
      return acc;
    },
    {} as Record<number, FixtureWithDetails[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full uppercase ${
                statusColors[tournament.status]
              }`}
            >
              {tournament.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600">{tournament.organisation?.name}</p>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500 uppercase">{tournament.sport}</span>
          <p className="text-sm text-gray-600">{tournament.format.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Tournament info */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tournament.fixtures?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tournament.fixtures?.filter((f) => f.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tournament.fixtures?.filter((f) => f.status === 'in_progress').length || 0}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tournament.is_doubles ? 'Doubles' : 'Singles'}
              </div>
              <div className="text-sm text-gray-500">Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixtures by round */}
      {fixturesByRound && Object.keys(fixturesByRound).length > 0 ? (
        Object.entries(fixturesByRound)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([round, fixtures]) => (
            <div key={round}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Round {round}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {fixtures.map((fixture) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    tournamentSlug={tournament.slug}
                  />
                ))}
              </div>
            </div>
          ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No fixtures scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FixtureCardProps {
  fixture: FixtureWithDetails;
  tournamentSlug: string;
}

function FixtureCard({ fixture, tournamentSlug }: FixtureCardProps) {
  const team1 = fixture.teams?.find((t) => t.team_position === 1);
  const team2 = fixture.teams?.find((t) => t.team_position === 2);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team1Name = team1?.players?.map((p: any) => p.player?.display_name || p.display_name).join(' / ') || 'TBD';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team2Name = team2?.players?.map((p: any) => p.player?.display_name || p.display_name).join(' / ') || 'TBD';

  const matchScore = Array.isArray(fixture.match_score)
    ? fixture.match_score[0]
    : fixture.match_score;

  const statusColors = {
    scheduled: 'text-gray-500',
    in_progress: 'text-green-600',
    completed: 'text-gray-700',
    cancelled: 'text-red-500',
    walkover: 'text-yellow-600',
  };

  return (
    <Link to={`/tournaments/${tournamentSlug}/fixtures/${fixture.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium ${statusColors[fixture.status]}`}>
              {fixture.status === 'in_progress' && (
                <span className="inline-flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  LIVE
                </span>
              )}
              {fixture.status !== 'in_progress' &&
                fixture.status.replace('_', ' ').toUpperCase()}
            </span>
            {fixture.court_name && (
              <span className="text-xs text-gray-500">{fixture.court_name}</span>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-2">
            <TeamLine
              name={team1Name}
              score={matchScore?.team1_sets_won}
              isWinner={team1?.is_winner ?? false}
              isServing={matchScore?.serving_team === 1 && fixture.status === 'in_progress'}
            />
            <TeamLine
              name={team2Name}
              score={matchScore?.team2_sets_won}
              isWinner={team2?.is_winner ?? false}
              isServing={matchScore?.serving_team === 2 && fixture.status === 'in_progress'}
            />
          </div>

          {/* Current game score if in progress */}
          {fixture.status === 'in_progress' && matchScore && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-sm text-gray-500">Game: </span>
              <span className="font-medium">
                {matchScore.current_point_team1}-{matchScore.current_point_team2}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface TeamLineProps {
  name: string;
  score?: number;
  isWinner: boolean;
  isServing: boolean;
}

function TeamLine({ name, score, isWinner, isServing }: TeamLineProps) {
  return (
    <div className={`flex items-center justify-between ${isWinner ? 'font-semibold' : ''}`}>
      <div className="flex items-center gap-2">
        {isServing && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
        <span className={isWinner ? 'text-primary-700' : 'text-gray-900'}>{name}</span>
      </div>
      {score !== undefined && (
        <span className={`text-lg ${isWinner ? 'text-primary-700' : 'text-gray-700'}`}>
          {score}
        </span>
      )}
    </div>
  );
}
