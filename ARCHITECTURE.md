# Sports Scoring App - Architecture & Implementation Plan

## Executive Summary

A real-time sports scoring application for tennis, pickleball, and similar racquet sports. Designed for ~50 concurrent games with ACID compliance and real-time updates.

---

## 1. Tech Stack Decisions

### Mobile Strategy: Progressive Web App (PWA)

**Recommendation: PWA over React Native**

| Factor | PWA | React Native |
|--------|-----|--------------|
| Development Speed | Faster - single codebase | Slower - platform bridges |
| Deployment | Instant updates | App store reviews |
| Real-time Support | Excellent with Supabase | Excellent with Supabase |
| Target Scale (~50 games) | Perfect fit | Over-engineered |

**Rationale:** For a scoring app with real-time updates, PWA provides instant deployment, easier maintenance, and sufficient offline capability via Service Workers.

### Backend: Supabase

**Recommendation: Supabase (not Firebase or custom backend)**

| Factor | Supabase | Firebase | Custom |
|--------|----------|----------|--------|
| PostgreSQL (ACID) | Native | No (NoSQL) | Manual |
| Real-time | Built-in | Built-in | Manual |
| Row-Level Security | Yes | Yes | Manual |
| OpenAPI | Auto-generated | No | Manual |

**Rationale:** ACID compliance requirement rules out Firebase. Supabase provides PostgreSQL with real-time subscriptions out of the box.

### Complete Tech Stack

```
Frontend:
├── React 18 + TypeScript
├── Vite (build tool)
├── TanStack Query (server state - replaces most useEffect)
├── Zustand (minimal client state)
├── lodash-es (functional utilities)
├── Tailwind CSS (styling)
└── Workbox (PWA service worker)

Backend:
├── Supabase (PostgreSQL + Auth + Real-time)
└── Supabase Edge Functions (TypeScript)

Testing:
├── Vitest (unit/integration)
├── Playwright (E2E)
└── MSW (API mocking)

Development:
├── pnpm (package manager)
├── ESLint + Prettier
└── Husky (git hooks)
```

---

## 2. Database Schema

### Entity Relationships

```
Organisation (1) ──< Tournament (M)
Tournament (1) ──< TournamentPlayer (M) >── Player (1)
Tournament (1) ──< Fixture (M)
Fixture (1) ──< FixtureTeam (2) >── Player (M) [for doubles]
Fixture (1) ──< MatchScore (1)
MatchScore (1) ──< SetScore (M)
Player (1) ──< auth.users (1)
```

### PostgreSQL Tables

```sql
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE sport_type AS ENUM ('tennis', 'pickleball', 'badminton', 'padel');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss');
CREATE TYPE fixture_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover');

-- ============================================
-- CORE ENTITIES
-- ============================================

-- Organisations host tournaments
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players are registered users
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation membership
CREATE TABLE organisation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'scorer', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organisation_id, player_id)
);

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sport sport_type NOT NULL,
    format tournament_format NOT NULL DEFAULT 'single_elimination',
    status tournament_status NOT NULL DEFAULT 'draft',
    is_doubles BOOLEAN NOT NULL DEFAULT FALSE,

    -- Scoring configuration (denormalized for query performance)
    scoring_config JSONB NOT NULL DEFAULT '{}',

    start_date DATE,
    end_date DATE,
    registration_deadline TIMESTAMPTZ,
    max_participants INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organisation_id, slug)
);

-- Players registered for a tournament
CREATE TABLE tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    seed_number INTEGER,
    registration_status VARCHAR(50) DEFAULT 'confirmed'
        CHECK (registration_status IN ('pending', 'confirmed', 'withdrawn')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tournament_id, player_id)
);

-- ============================================
-- FIXTURES (MATCHES)
-- ============================================

CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    court_name VARCHAR(100),
    scheduled_time TIMESTAMPTZ,
    status fixture_status NOT NULL DEFAULT 'scheduled',

    -- For bracket progression
    winner_advances_to UUID REFERENCES fixtures(id) ON DELETE SET NULL,
    loser_drops_to UUID REFERENCES fixtures(id) ON DELETE SET NULL,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tournament_id, round_number, match_number)
);

-- Teams/sides in a fixture (always exactly 2 per fixture)
CREATE TABLE fixture_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    team_position INTEGER NOT NULL CHECK (team_position IN (1, 2)),
    is_winner BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fixture_id, team_position)
);

-- Players in each team (1 for singles, 2 for doubles)
CREATE TABLE fixture_team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_team_id UUID NOT NULL REFERENCES fixture_teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    UNIQUE(fixture_team_id, player_id)
);

-- ============================================
-- SCORING
-- ============================================

-- Match-level score (aggregate)
CREATE TABLE match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL UNIQUE REFERENCES fixtures(id) ON DELETE CASCADE,

    team1_sets_won INTEGER NOT NULL DEFAULT 0,
    team2_sets_won INTEGER NOT NULL DEFAULT 0,

    -- Current game score within current set
    current_set_number INTEGER NOT NULL DEFAULT 1,
    current_game_team1 INTEGER NOT NULL DEFAULT 0,
    current_game_team2 INTEGER NOT NULL DEFAULT 0,

    -- Point score within current game (tennis: 0, 15, 30, 40, AD)
    current_point_team1 VARCHAR(10) NOT NULL DEFAULT '0',
    current_point_team2 VARCHAR(10) NOT NULL DEFAULT '0',

    serving_team INTEGER CHECK (serving_team IN (1, 2)),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual set scores
CREATE TABLE set_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_score_id UUID NOT NULL REFERENCES match_scores(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    team1_games INTEGER NOT NULL DEFAULT 0,
    team2_games INTEGER NOT NULL DEFAULT 0,

    is_tiebreak BOOLEAN DEFAULT FALSE,
    team1_tiebreak_points INTEGER,
    team2_tiebreak_points INTEGER,

    winner_team INTEGER CHECK (winner_team IN (1, 2)),
    completed_at TIMESTAMPTZ,

    UNIQUE(match_score_id, set_number)
);

-- Score history for audit/replay (append-only log)
CREATE TABLE score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    scoring_team INTEGER NOT NULL CHECK (scoring_team IN (1, 2)),
    score_snapshot JSONB NOT NULL,
    recorded_by UUID REFERENCES players(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tournaments_organisation ON tournaments(organisation_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_match_scores_fixture ON match_scores(fixture_id);
CREATE INDEX idx_score_events_fixture ON score_events(fixture_id);
CREATE INDEX idx_score_events_recorded_at ON score_events(recorded_at DESC);
```

### Scoring Configuration (JSONB)

```typescript
interface ScoringConfig {
  sport: 'tennis' | 'pickleball' | 'badminton' | 'padel';
  setsToWin: number;           // 2 for best-of-3, 3 for best-of-5
  gamesPerSet: number;         // 6 for standard tennis
  tiebreakAt: number;          // 6 (play tiebreak at 6-6)
  finalSetTiebreak: boolean;   // true for super-tiebreak in final set
  finalSetTiebreakPoints: number; // 10 for super-tiebreak
  advantageScoring: boolean;   // true for deuce/advantage
  pointsPerGame?: number;      // 11 or 15 for pickleball
  winByTwo: boolean;
  rallyScoring: boolean;       // false = side-out scoring
}
```

---

## 3. Sport-Specific Scoring

### Tennis Scoring State Machine

```typescript
const TENNIS_POINTS = ['0', '15', '30', '40'] as const;
type TennisPoint = typeof TENNIS_POINTS[number] | 'AD';

interface TennisMatchState {
  sets: SetState[];
  currentSetIndex: number;
  currentGame: { team1Points: TennisPoint; team2Points: TennisPoint };
  servingTeam: 1 | 2;
  matchWinner: 1 | 2 | null;
}

// Pure function - functional approach
function scorePoint(
  state: TennisMatchState,
  scoringTeam: 1 | 2,
  config: ScoringConfig
): TennisMatchState {
  // Handles: point scoring, deuce/advantage, game/set/match completion
  // Returns new immutable state
}
```

### Pickleball Differences

```typescript
interface PickleballGameState {
  team1Points: number;  // Simple numeric (0, 1, 2, ... 11+)
  team2Points: number;
  servingTeam: 1 | 2;
  serverNumber: 1 | 2;  // In doubles, which player is serving
}

// Games to 11 or 15, win by 2
// Best of 3 games
// Rally scoring (newer) or side-out (traditional)
```

---

## 4. Project Structure

```
/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_scoring_functions.sql
│   ├── functions/
│   │   ├── score-point/
│   │   │   └── index.ts
│   │   └── _shared/
│   │       └── types.ts
│   └── seed.sql
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components
│   │   ├── layout/                   # Header, Sidebar, etc.
│   │   └── common/                   # LoadingSpinner, ErrorBoundary
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   └── hooks/useAuth.ts
│   │   │
│   │   ├── tournaments/
│   │   │   ├── components/
│   │   │   │   ├── TournamentCard.tsx
│   │   │   │   ├── TournamentBracket.tsx
│   │   │   │   └── DrawGenerator.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── fixtures/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   └── scoring/
│   │       ├── components/
│   │       │   ├── LiveScoreboard.tsx
│   │       │   ├── ScoringPanel.tsx
│   │       │   └── sports/
│   │       │       ├── TennisScoreboard.tsx
│   │       │       └── PickleballScoreboard.tsx
│   │       ├── hooks/
│   │       │   ├── useScoring.ts
│   │       │   └── useScoreSubscription.ts
│   │       └── engine/
│   │           ├── index.ts
│   │           ├── tennis.ts
│   │           └── pickleball.ts
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── tournaments/
│   │   └── fixtures/
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── query-client.ts
│   │   └── utils/
│   │
│   ├── stores/
│   │   └── ui.store.ts               # Zustand (minimal UI state only)
│   │
│   └── types/
│       ├── database.types.ts         # Auto-generated from Supabase
│       └── scoring.types.ts
│
├── tests/
│   ├── unit/scoring/
│   ├── integration/api/
│   └── e2e/
│
└── public/
    ├── manifest.json                 # PWA manifest
    └── icons/
```

---

## 5. State Management Strategy

| State Type | Solution | Examples |
|------------|----------|----------|
| Server State | TanStack Query | Tournaments, fixtures, scores |
| Real-time Updates | Supabase Realtime + Query invalidation | Live scores |
| UI State | Zustand (minimal) | Modal open, selected tab |
| Form State | React Hook Form | Score correction form |
| URL State | React Router | Current tournament, fixture |

### TanStack Query (Avoids useEffect)

```typescript
// Query keys factory
export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  detail: (slug: string) => [...tournamentKeys.all, 'detail', slug] as const,
};

// Fetch with caching
export function useTournament(slug: string) {
  return useQuery({
    queryKey: tournamentKeys.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`*, fixtures(*, match_score:match_scores(*))`)
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

// Optimistic mutations
export function useScorePoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fixtureId, scoringTeam }) => {
      const { data, error } = await supabase.functions.invoke('score-point', {
        body: { fixtureId, scoringTeam },
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ fixtureId, scoringTeam }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['fixtures', fixtureId] });
      const previous = queryClient.getQueryData(['fixtures', fixtureId]);
      // Update cache optimistically...
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['fixtures', variables.fixtureId], context.previous);
      }
    },
  });
}
```

---

## 6. Real-Time Subscriptions

```typescript
// Subscribe to live score updates
export function useFixtureSubscription(fixtureId: string) {
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
        (payload) => {
          // Update cache directly (no refetch needed)
          queryClient.setQueryData(['fixtures', fixtureId], (old) => ({
            ...old,
            match_score: payload.new,
          }));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fixtureId, queryClient]);
}
```

### Subscription Strategy by View

| View | Subscription | Reason |
|------|--------------|--------|
| Live Scoreboard | Single `match_scores` row | Real-time point-by-point |
| Tournament Bracket | Tournament-level | Update when matches complete |
| Scorer Panel | Single `match_scores` row | Sync multiple scorers |
| Tournament List | None (poll on focus) | Low update frequency |

---

## 7. Key TypeScript Types

```typescript
// /src/types/scoring.types.ts

export type SportType = 'tennis' | 'pickleball' | 'badminton' | 'padel';

export interface ScoringConfig {
  sport: SportType;
  setsToWin: number;
  gamesPerSet: number;
  tiebreakAt: number;
  finalSetTiebreak: boolean;
  finalSetTiebreakPoints: number;
  advantageScoring: boolean;
  pointsPerGame?: number;
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

export type TennisPoint = '0' | '15' | '30' | '40' | 'AD';

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

export interface SetState {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  isTiebreak: boolean;
  tiebreakScore: { team1: number; team2: number } | null;
  winner: 1 | 2 | null;
}

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
export type FixtureStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover';
```

---

## 8. Testing Strategy

### Test Pyramid

```
         /\          E2E (Playwright) - ~10 tests
        /  \         Critical user flows
       /----\
      /      \       Integration - ~30 tests
     /        \      API endpoints, DB operations
    /----------\
   /            \    Unit - ~100+ tests
  /              \   Scoring engine, utilities
 /================\
```

### Critical Unit Tests

```typescript
// /tests/unit/scoring/tennis.test.ts
describe('Tennis Scoring Engine', () => {
  it('should follow sequence 0 -> 15 -> 30 -> 40 -> game');
  it('should go to deuce at 40-40');
  it('should award advantage from deuce');
  it('should return to deuce if advantage lost');
  it('should win set at 6-4');
  it('should trigger tiebreak at 6-6');
  it('should win tiebreak at 7-5 (win by 2)');
  it('should change server after each game');
  it('should change server every 2 points in tiebreak');
});
```

---

## 9. Implementation Phases

### Phase 1: Foundation
- Set up Supabase project and database schema
- Configure authentication
- Set up React app with Vite, TypeScript, TanStack Query
- Basic CRUD for organisations and tournaments
- CI/CD pipeline

### Phase 2: Core Scoring
- Tennis scoring engine (pure functions)
- Scoring database functions with transactions
- Scorer panel UI
- Real-time subscriptions
- Unit tests for scoring logic

### Phase 3: Tournament Features
- Bracket generation for single elimination
- Fixture scheduling
- Player registration flow
- Live scoreboard for spectators

### Phase 4: Polish and PWA
- PWA setup (manifest, service worker)
- Offline support for viewing scores
- Mobile-optimized UI
- Add pickleball scoring variant
- E2E testing

---

## 10. Critical Files

1. **`/supabase/migrations/001_initial_schema.sql`** - Database foundation
2. **`/src/features/scoring/engine/tennis.ts`** - Core scoring logic
3. **`/src/features/scoring/hooks/useScoring.ts`** - React + real-time bridge
4. **`/src/types/scoring.types.ts`** - TypeScript interfaces
5. **`/supabase/functions/score-point/index.ts`** - ACID-compliant score updates
