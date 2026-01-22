import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { TournamentListPage } from '@/pages/tournaments/TournamentListPage';
import { TournamentDetailPage } from '@/pages/tournaments/TournamentDetailPage';
import { FixtureDetailPage } from '@/pages/fixtures/FixtureDetailPage';
import { ScorerPage } from '@/pages/fixtures/ScorerPage';

function App() {
  const queryClient = useQueryClient();

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(['session'], session);

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournaments" element={<TournamentListPage />} />
        <Route path="/tournaments/:slug" element={<TournamentDetailPage />} />
        <Route path="/tournaments/:slug/fixtures/:fixtureId" element={<FixtureDetailPage />} />
        <Route path="/tournaments/:slug/fixtures/:fixtureId/score" element={<ScorerPage />} />
      </Route>
    </Routes>
  );
}

export default App;
