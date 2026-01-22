-- ============================================
-- SPORTS SCORING APP - INITIAL SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players are registered users
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation membership
CREATE TABLE organisation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sport sport_type NOT NULL,
    format tournament_format NOT NULL DEFAULT 'single_elimination',
    status tournament_status NOT NULL DEFAULT 'draft',
    is_doubles BOOLEAN NOT NULL DEFAULT FALSE,

    -- Scoring configuration (JSONB for flexibility)
    scoring_config JSONB NOT NULL DEFAULT '{
        "setsToWin": 2,
        "gamesPerSet": 6,
        "tiebreakAt": 6,
        "finalSetTiebreak": true,
        "finalSetTiebreakPoints": 10,
        "advantageScoring": true,
        "winByTwo": true,
        "rallyScoring": false
    }'::jsonb,

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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    team_position INTEGER NOT NULL CHECK (team_position IN (1, 2)),
    is_winner BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fixture_id, team_position)
);

-- Players in each team (1 for singles, 2 for doubles)
CREATE TABLE fixture_team_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_team_id UUID NOT NULL REFERENCES fixture_teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    UNIQUE(fixture_team_id, player_id)
);

-- ============================================
-- SCORING
-- ============================================

-- Match-level score (aggregate)
CREATE TABLE match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Individual set scores (for history/stats)
CREATE TABLE set_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_organisation_members_org ON organisation_members(organisation_id);
CREATE INDEX idx_organisation_members_player ON organisation_members(player_id);
CREATE INDEX idx_tournaments_organisation ON tournaments(organisation_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_sport ON tournaments(sport);
CREATE INDEX idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_player ON tournament_players(player_id);
CREATE INDEX idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixture_teams_fixture ON fixture_teams(fixture_id);
CREATE INDEX idx_fixture_team_players_team ON fixture_team_players(fixture_team_id);
CREATE INDEX idx_match_scores_fixture ON match_scores(fixture_id);
CREATE INDEX idx_set_scores_match ON set_scores(match_score_id);
CREATE INDEX idx_score_events_fixture ON score_events(fixture_id);
CREATE INDEX idx_score_events_recorded_at ON score_events(recorded_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organisations_updated_at
    BEFORE UPDATE ON organisations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixtures_updated_at
    BEFORE UPDATE ON fixtures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_scores_updated_at
    BEFORE UPDATE ON match_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create player profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.players (user_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Auto-create match_scores when fixture is created
CREATE OR REPLACE FUNCTION handle_new_fixture()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.match_scores (fixture_id, serving_team)
    VALUES (NEW.id, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_fixture_created
    AFTER INSERT ON fixtures
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_fixture();
