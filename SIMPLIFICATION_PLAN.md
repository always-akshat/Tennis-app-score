# Simplification Plan: Sports Scoring App

This document outlines proposed architectural simplifications. Let's discuss each one.

---

## Overview

| # | Change | Effort | Impact | Status |
|---|--------|--------|--------|--------|
| 1 | Simplify Docker (8 → 1 container) | 30 min | High | Pending |
| 2 | Remove Zustand dependency | 5 min | Low | **Done** |
| 3 | Replace WebSockets with polling | 2 hours | High | Pending |
| 4 | Consolidate 4 scoring hooks → 1 | 1 hour | Medium | Pending |
| 5 | Merge score tables (3 → 1) | 3 hours | Medium | Pending |
| 6 | Flatten fixture_teams tables | 2 hours | Medium | Pending |
| 7 | Split types from configs | 15 min | Low | Pending |

---

## 1. Simplify Docker Stack

### Current State
8 containers: PostgreSQL, Kong, GoTrue, PostgREST, Realtime, Studio, Meta, Inbucket

### Proposed
1 container: PostgreSQL only

### Rationale
- For 50 concurrent games, we don't need API gateway, dedicated auth server, etc.
- Supabase JS client can connect directly to Postgres via their hosted service
- Local dev only needs Postgres; use Supabase Cloud for the rest

### Trade-offs
| Pros | Cons |
|------|------|
| 5s startup vs 30s | No local Supabase Studio UI |
| 400MB RAM vs 2GB | Must use Supabase Cloud for auth |
| Simpler debugging | Less parity with production |

### Decision Needed
- **Option A**: Single Postgres container (simplest)
- **Option B**: Postgres + Studio only (still have UI)
- **Option C**: Keep full stack (no change)

---

## 2. Remove Zustand

### Current State
```json
"dependencies": {
  "zustand": "^4.5.4"  // Installed but never imported
}
```

### Proposed
```bash
npm remove zustand
```

### Rationale
- Zero imports of Zustand anywhere in codebase
- TanStack Query handles all server state
- No client-only state that needs Zustand

### Trade-offs
| Pros | Cons |
|------|------|
| Smaller bundle | None - it's unused |
| Cleaner dependencies | |

### Decision Needed
- **Option A**: Remove it (recommended)
- **Option B**: Keep for future use

---

## 3. Replace WebSockets with Polling

### Current State
```typescript
// useScoring.ts - Supabase Realtime subscription
useEffect(() => {
  const channel = supabase
    .channel(`fixture:${fixtureId}`)
    .on('postgres_changes', {...}, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [fixtureId]);
```

### Proposed
```typescript
// Simple polling with TanStack Query
useQuery({
  queryKey: ['match', fixtureId],
  queryFn: fetchMatchData,
  refetchInterval: 2000,  // Poll every 2 seconds
});
```

### Rationale
- 50 games × 2 requests/sec = 100 req/sec (trivial load)
- Eliminates WebSocket connection management
- Simpler debugging (HTTP vs WS)
- No subscription memory leak risks

### Trade-offs
| Pros | Cons |
|------|------|
| Simpler infrastructure | 2s latency vs ~100ms |
| No WS server needed | Slightly more bandwidth |
| Easier debugging | Less "real-time" feeling |

### Decision Needed
- **Option A**: Replace with 2s polling (recommended for 50 games)
- **Option B**: Replace with 1s polling (faster updates)
- **Option C**: Keep WebSockets (if latency is critical)

---

## 4. Consolidate Scoring Hooks

### Current State
```typescript
// 4 separate hooks in useScoring.ts
const fixture = useFixture(fixtureId);        // Fetch fixture
const events = useScoreEvents(fixtureId);      // Fetch events
useScoreSubscription(fixtureId);               // Subscribe to updates
const { matchState } = useMatchState(fixtureId); // Build state
```

### Proposed
```typescript
// 1 unified hook
const { matchState, events, fixture } = useMatchData(fixtureId);
```

### Rationale
- These 4 hooks always used together
- Reduces component complexity
- Single source of truth for match data

### Trade-offs
| Pros | Cons |
|------|------|
| Simpler component code | Less granular control |
| Fewer re-renders | Larger single query |
| Easier to understand | |

### Decision Needed
- **Option A**: Consolidate into 1 hook (recommended)
- **Option B**: Keep separate for flexibility

---

## 5. Merge Score Tables

### Current State
```sql
-- 3 tables storing overlapping data
match_scores    -- Current state (denormalized)
set_scores      -- Historical set data
score_events    -- Full audit log with snapshots
```

### Proposed
```sql
-- 1 table: append-only event log
score_changes (
  id, fixture_id, scoring_team,
  snapshot JSONB,  -- Full MatchState
  recorded_at
)

-- Derive everything from this:
-- Current state = last snapshot
-- History = all snapshots ordered by time
```

### Rationale
- `score_events.snapshot` already contains full state
- `match_scores` is redundant (can derive from last event)
- `set_scores` is redundant (can derive from snapshots)
- 1 write per point instead of 3

### Trade-offs
| Pros | Cons |
|------|------|
| 1 write vs 3 writes | Must replay events to get current state |
| Simpler schema | Slightly more compute on read |
| Single source of truth | Migration effort |

### Decision Needed
- **Option A**: Merge all into score_changes (cleanest)
- **Option B**: Keep match_scores as cache, drop set_scores (hybrid)
- **Option C**: Keep current schema (no change)

---

## 6. Flatten fixture_teams Tables

### Current State
```sql
fixtures
  ↓
fixture_teams (id, fixture_id, team_position)  -- Always exactly 2 rows
  ↓
fixture_team_players (fixture_team_id, player_id)  -- 1-2 rows per team
  ↓
players
```

### Proposed
```sql
fixtures (
  ...
  team1_player_ids UUID[],  -- e.g., ['alice-uuid']
  team2_player_ids UUID[],  -- e.g., ['bob-uuid', 'carol-uuid'] for doubles
)
```

### Rationale
- `fixture_teams` always has exactly 2 rows per fixture (team 1 and team 2)
- This is boilerplate normalization that adds queries without value
- Array columns are simpler for this use case

### Trade-offs
| Pros | Cons |
|------|------|
| Fewer joins | Less normalized |
| Simpler queries | Arrays are less queryable |
| Fewer tables | Postgres array syntax |

### Decision Needed
- **Option A**: Flatten to arrays (recommended for simplicity)
- **Option B**: Keep normalized (if you need complex team queries)

---

## 7. Split Types from Configs

### Current State
```typescript
// scoring.types.ts (197 lines) - mixed types and runtime values
export interface ScoringConfig { ... }
export const TENNIS_STANDARD: ScoringConfig = { ... };
export const PICKLEBALL_STANDARD: ScoringConfig = { ... };
export function isTennisGameState() { ... }
```

### Proposed
```typescript
// scoring.types.ts - types only
export interface ScoringConfig { ... }

// scoring.configs.ts - runtime values
export const TENNIS_STANDARD = { ... };

// scoring.utils.ts - utility functions (if needed)
export const isTennisGameState = () => { ... };
```

### Rationale
- Types and runtime values serve different purposes
- Cleaner imports
- Easier to tree-shake

### Trade-offs
| Pros | Cons |
|------|------|
| Cleaner separation | More files |
| Better organization | Minor refactor |

### Decision Needed
- **Option A**: Split into separate files (cleaner)
- **Option B**: Keep in one file (fewer files)

---

## Discussion Order

Let's go through these one by one:

1. **Zustand removal** - Quick win, no downsides
2. **Docker simplification** - Affects local dev experience
3. **WebSockets vs Polling** - Core architecture decision
4. **Hook consolidation** - Code organization
5. **Database schema** - Biggest change, most impact
6. **fixture_teams flattening** - Part of schema changes
7. **Types/configs split** - Low priority cleanup

Ready to discuss #1?
