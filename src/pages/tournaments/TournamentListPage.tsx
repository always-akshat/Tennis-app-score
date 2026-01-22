import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui';
import { LoadingPage, ErrorMessage } from '@/components/common';
import type { Tournament, Organisation } from '@/types';

interface TournamentWithOrg extends Tournament {
  organisation: Organisation;
}

export function TournamentListPage() {
  const {
    data: tournaments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async (): Promise<TournamentWithOrg[]> => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, organisation:organisations(*)')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TournamentWithOrg[];
    },
  });

  if (isLoading) return <LoadingPage />;

  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load tournaments'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tournaments</h1>
      </div>

      {tournaments?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tournaments yet
            </h3>
            <p className="text-gray-600">
              Check back later for upcoming tournaments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments?.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TournamentCardProps {
  tournament: TournamentWithOrg;
}

function TournamentCard({ tournament }: TournamentCardProps) {
  const statusColors = {
    registration: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Link to={`/tournaments/${tournament.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full uppercase ${
                statusColors[tournament.status]
              }`}
            >
              {tournament.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500 uppercase">
              {tournament.sport}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {tournament.name}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {tournament.organisation.name}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{tournament.format.replace('_', ' ')}</span>
            {tournament.start_date && (
              <span>
                {new Date(tournament.start_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
