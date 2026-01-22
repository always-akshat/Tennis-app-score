# Sports Scoring App

A real-time sports scoring application for tennis, pickleball, and similar racquet sports. Built with React, TypeScript, and Supabase.

## Table of Contents

- [Overview](#overview)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Reading the Codebase](#reading-the-codebase)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [What's Left to Build](#whats-left-to-build)
- [Project Structure](#project-structure)

---

## Overview

This app enables real-time score tracking for racquet sports tournaments. Key features:

- **Live scoring** - Scorers tap to record points, spectators see updates instantly
- **Multi-sport support** - Tennis and pickleball with sport-specific rules
- **Tournament management** - Organizations create tournaments with brackets
- **Mobile-first PWA** - Works on phones without app store installation

### Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 18 + TypeScript | Type safety, component reusability |
| Build | Vite | Fast dev server, optimized builds |
| Styling | Tailwind CSS | Rapid UI development, mobile-first |
| State | TanStack Query | Server state caching, avoids useEffect |
| Backend | Supabase | PostgreSQL + Auth + Real-time in one |
| Testing | Vitest | Fast, Vite-native testing |

---

## Architecture & Design Decisions

### Why These Choices?

#### PWA over React Native

We chose a Progressive Web App instead of React Native because:

1. **Instant deployment** - No app store review delays (critical during tournaments)
2. **Single codebase** - Same code serves web and "installed" mobile
3. **Simpler development** - No native bridge complexity
4. **Sufficient for our needs** - We don't need camera, GPS, or other native APIs

#### Supabase over Firebase/Custom Backend

1. **ACID compliance** - PostgreSQL transactions ensure score integrity (Firebase is NoSQL)
2. **Real-time built-in** - WebSocket subscriptions without custom infrastructure
3. **Row-Level Security** - Authorization logic lives in the database, not scattered in code
4. **Auto-generated types** - `supabase gen types` creates TypeScript definitions

#### TanStack Query over Redux/Context

1. **Server state belongs on the server** - Query caches and syncs automatically
2. **Eliminates most useEffect** - Data fetching is declarative
3. **Optimistic updates** - UI responds instantly, rolls back on error
4. **Built-in real-time** - Pairs perfectly with Supabase subscriptions

#### Functional Scoring Engine

The scoring logic (`src/features/scoring/engine/`) is pure functional:

```typescript
// Input: current state + who scored
// Output: new state (no mutations)
function scorePoint(state: MatchState, team: 1 | 2): MatchState
```

Benefits:
- **Testable** - 21 unit tests cover all tennis scoring edge cases
- **Predictable** - Same inputs always produce same outputs
- **Debuggable** - State snapshots saved for undo/replay

### Database Design Philosophy

1. **Denormalize for reads** - `match_scores` has current game/set/point for fast queries
2. **Normalize for writes** - `score_events` is append-only audit log
3. **JSONB for flexibility** - `scoring_config` allows sport-specific rules without schema changes
4. **RLS over application auth** - Database enforces who can update what

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema and API documentation.

---

## Reading the Codebase

### Start Here (Recommended Order)

#### 1. Understand the Types First

```
src/types/scoring.types.ts    # Core domain: MatchState, SetState, ScoringConfig
src/types/database.types.ts   # Auto-generated Supabase types
src/types/index.ts            # Re-exports and derived types
```

Key types to understand:
- `MatchState` - Complete state of a match (sets, games, points, server)
- `ScoringConfig` - Rules for a sport (sets to win, tiebreak rules, etc.)
- `Team` - Always `1` or `2` (not player IDs - keeps scoring generic)

#### 2. Follow the Scoring Engine

```
src/features/scoring/engine/tennis.ts     # ~400 lines, heavily commented
src/features/scoring/engine/pickleball.ts # Similar structure
src/features/scoring/engine/index.ts      # Factory: getScorer(sport)
```

Read `tennis.ts` top-to-bottom:
1. `createInitialState()` - How a match starts
2. `scorePoint()` - Main entry point, delegates to helpers
3. `scoreRegularPoint()` - 0→15→30→40→game logic
4. `scoreTiebreakPoint()` - Numeric tiebreak logic
5. `checkSetWon()` / `checkMatchWon()` - Win conditions

#### 3. See How State Flows

```
src/features/scoring/hooks/useScoring.ts  # TanStack Query + Supabase
```

Key hooks:
- `useFixture(id)` - Fetches fixture with teams and current score
- `useMatchState(id)` - Builds `MatchState` from DB + subscribes to changes
- `useScorePoint()` - Mutation that updates DB and triggers real-time

#### 4. Explore the UI

```
src/features/scoring/components/LiveScoreboard.tsx  # Display component
src/features/scoring/components/ScoringPanel.tsx    # Input component
src/pages/fixtures/ScorerPage.tsx                   # Puts it together
```

#### 5. Database Layer

```
supabase/migrations/001_initial_schema.sql  # Tables and indexes
supabase/migrations/002_rls_policies.sql    # Security rules
supabase/seed.sql                           # Test data
```

### Key Patterns to Notice

#### Pattern: Query Keys Factory

```typescript
// src/features/scoring/hooks/useScoring.ts
export const fixtureKeys = {
  all: ['fixtures'] as const,
  detail: (id: string) => [...fixtureKeys.all, id] as const,
  events: (id: string) => [...fixtureKeys.detail(id), 'events'] as const,
};
```

This enables precise cache invalidation after mutations.

#### Pattern: Optimistic Updates

```typescript
// Mutation updates UI immediately, rolls back on error
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: [...] });
  const previous = queryClient.getQueryData([...]);
  queryClient.setQueryData([...], optimisticValue);
  return { previous };
},
onError: (err, variables, context) => {
  queryClient.setQueryData([...], context.previous);
},
```

#### Pattern: Real-time Subscription + Query Invalidation

```typescript
// Subscribe to Postgres changes, invalidate query to refetch
supabase
  .channel(`fixture:${id}`)
  .on('postgres_changes', { table: 'match_scores' }, () => {
    queryClient.invalidateQueries({ queryKey: fixtureKeys.detail(id) });
  })
  .subscribe();
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Git

### Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/always-akshat/Tennis-app-score.git
cd Tennis-app-score
npm install

# 2. Start local Supabase (requires Docker)
docker compose up -d

# 3. Set environment variables
cp .env.example .env
# Edit .env with the local Supabase values shown after docker compose up

# 4. Run database migrations
npm run db:migrate

# 5. Seed test data
npm run db:seed

# 6. Start development server
npm run dev

# Open http://localhost:5173
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# All checks
npm run test && npm run typecheck && npm run build
```

### Environment Variables

```bash
# .env
VITE_SUPABASE_URL=http://localhost:54321      # Local Supabase API
VITE_SUPABASE_ANON_KEY=eyJ...                 # From supabase start output
```

---

## Deployment

### Local Development with Docker

The included `docker-compose.yml` runs the full Supabase stack locally:

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Reset database (warning: deletes data)
docker compose down -v
docker compose up -d
```

Services started:
- **PostgreSQL** (port 54322) - Database
- **Supabase API** (port 54321) - REST/GraphQL
- **Supabase Studio** (port 54323) - Database UI
- **Realtime** - WebSocket subscriptions
- **Auth** - User authentication

### Deploying to Supabase Cloud

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project, note the project URL and anon key
3. Go to SQL Editor and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

#### 2. Configure Environment

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Deploy Frontend

**Option A: Vercel (Recommended)**

```bash
npm install -g vercel
vercel
# Follow prompts, add environment variables in Vercel dashboard
```

**Option B: Netlify**

```bash
npm run build
# Upload dist/ folder to Netlify
# Add environment variables in Netlify dashboard
```

**Option C: Self-hosted**

```bash
npm run build
# Serve dist/ with any static file server (nginx, caddy, etc.)
```

#### 4. Enable Realtime

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for tables: `match_scores`, `score_events`, `fixtures`

#### 5. Configure Auth (Optional)

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Set Site URL to your deployed frontend URL
3. Configure OAuth providers if needed

---

## What's Left to Build

### Critical for MVP

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Tournament Creation UI** | Form to create tournament with settings | Medium |
| **Player Registration** | Join tournament, manage roster | Medium |
| **Bracket Generation** | Auto-generate single/double elimination brackets | High |
| **Auth Integration** | Login/signup flows, protected routes | Medium |

### Important but Not Blocking

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Doubles Support** | 2 players per team, serving rotation | Medium |
| **Score Correction** | Admin can fix scoring mistakes | Low |
| **Match History** | View completed matches with point-by-point | Low |
| **Push Notifications** | Alert when match starts/ends | Medium |

### Nice to Have

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Offline Mode** | Service worker caches for spotty connections | High |
| **Statistics** | Player win rates, head-to-head | Medium |
| **Live Commentary** | Text updates during match | Low |
| **Embed Widget** | Scoreboard for external websites | Medium |

### Known Issues

1. **Type Safety** - Some Supabase queries use `as any` due to complex joins
2. **Error Handling** - Network errors need better user feedback
3. **Loading States** - Some pages flash loading spinner

### Technical Debt

- [ ] Generate proper Supabase types with `supabase gen types typescript`
- [ ] Add E2E tests with Playwright
- [ ] Implement proper error boundaries
- [ ] Add request retry logic for flaky connections

---

## Project Structure

```
├── src/
│   ├── features/                 # Feature-based modules
│   │   ├── scoring/
│   │   │   ├── engine/           # Pure scoring logic (tennis.ts, pickleball.ts)
│   │   │   ├── components/       # LiveScoreboard, ScoringPanel
│   │   │   └── hooks/            # useScoring, useMatchState
│   │   └── auth/
│   │       └── hooks/            # useAuth, useSignIn, useSignOut
│   │
│   ├── components/
│   │   ├── ui/                   # Base components (Button, Card, Input)
│   │   ├── layout/               # App shell, navigation
│   │   └── common/               # LoadingSpinner, ErrorMessage
│   │
│   ├── pages/                    # Route components
│   │   ├── tournaments/
│   │   └── fixtures/
│   │
│   ├── types/                    # TypeScript definitions
│   ├── lib/                      # Supabase client, query client
│   └── styles/                   # Tailwind config, global CSS
│
├── supabase/
│   ├── migrations/               # SQL schema files
│   ├── seed.sql                  # Development data
│   └── config.toml               # Local Supabase config
│
├── tests/
│   └── unit/scoring/             # Scoring engine tests
│
├── public/                       # Static assets, PWA manifest
├── docker-compose.yml            # Local development stack
└── ARCHITECTURE.md               # Detailed technical documentation
```

---

## Scripts Reference

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:watch   # Tests in watch mode
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
npm run db:migrate   # Run Supabase migrations
npm run db:seed      # Load seed data
npm run db:reset     # Reset database
```

---

## Contributing

1. Create a feature branch from `main`
2. Make changes with tests
3. Ensure `npm run test && npm run typecheck && npm run build` passes
4. Submit PR with description of changes

---

## License

MIT
