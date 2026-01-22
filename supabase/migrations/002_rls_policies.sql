-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get player ID for current user
CREATE OR REPLACE FUNCTION get_current_player_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM players
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organisation_members
        WHERE organisation_id = org_id
        AND player_id = get_current_player_id()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org scorer
CREATE OR REPLACE FUNCTION is_org_scorer(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organisation_members
        WHERE organisation_id = org_id
        AND player_id = get_current_player_id()
        AND role IN ('owner', 'admin', 'scorer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ORGANISATIONS
-- ============================================

-- Anyone can view organisations
CREATE POLICY "Organisations are viewable by everyone"
    ON organisations FOR SELECT
    USING (true);

-- Only admins can modify organisations
CREATE POLICY "Organisation admins can update"
    ON organisations FOR UPDATE
    USING (is_org_admin(id));

-- ============================================
-- PLAYERS
-- ============================================

-- Anyone can view players
CREATE POLICY "Players are viewable by everyone"
    ON players FOR SELECT
    USING (true);

-- Users can update their own player profile
CREATE POLICY "Users can update own player profile"
    ON players FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- ORGANISATION MEMBERS
-- ============================================

-- Anyone can view organisation members
CREATE POLICY "Organisation members are viewable by everyone"
    ON organisation_members FOR SELECT
    USING (true);

-- Only org admins can manage members
CREATE POLICY "Organisation admins can manage members"
    ON organisation_members FOR ALL
    USING (is_org_admin(organisation_id));

-- ============================================
-- TOURNAMENTS
-- ============================================

-- Public tournaments are viewable by everyone
CREATE POLICY "Public tournaments are viewable by everyone"
    ON tournaments FOR SELECT
    USING (status != 'draft');

-- Org admins can see all tournaments including drafts
CREATE POLICY "Organisation admins can see all tournaments"
    ON tournaments FOR SELECT
    USING (is_org_admin(organisation_id));

-- Org admins can create tournaments
CREATE POLICY "Organisation admins can create tournaments"
    ON tournaments FOR INSERT
    WITH CHECK (is_org_admin(organisation_id));

-- Org admins can update tournaments
CREATE POLICY "Organisation admins can update tournaments"
    ON tournaments FOR UPDATE
    USING (is_org_admin(organisation_id));

-- Org admins can delete tournaments
CREATE POLICY "Organisation admins can delete tournaments"
    ON tournaments FOR DELETE
    USING (is_org_admin(organisation_id));

-- ============================================
-- TOURNAMENT PLAYERS
-- ============================================

-- Anyone can view tournament players
CREATE POLICY "Tournament players are viewable by everyone"
    ON tournament_players FOR SELECT
    USING (true);

-- Org admins can manage tournament players
CREATE POLICY "Organisation admins can manage tournament players"
    ON tournament_players FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id
            AND is_org_admin(t.organisation_id)
        )
    );

-- Players can register themselves
CREATE POLICY "Players can register for tournaments"
    ON tournament_players FOR INSERT
    WITH CHECK (player_id = get_current_player_id());

-- ============================================
-- FIXTURES
-- ============================================

-- Anyone can view fixtures
CREATE POLICY "Fixtures are viewable by everyone"
    ON fixtures FOR SELECT
    USING (true);

-- Org admins can manage fixtures
CREATE POLICY "Organisation admins can manage fixtures"
    ON fixtures FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id
            AND is_org_admin(t.organisation_id)
        )
    );

-- Scorers can update fixture status
CREATE POLICY "Scorers can update fixtures"
    ON fixtures FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id
            AND is_org_scorer(t.organisation_id)
        )
    );

-- ============================================
-- FIXTURE TEAMS
-- ============================================

-- Anyone can view fixture teams
CREATE POLICY "Fixture teams are viewable by everyone"
    ON fixture_teams FOR SELECT
    USING (true);

-- Org admins can manage fixture teams
CREATE POLICY "Organisation admins can manage fixture teams"
    ON fixture_teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM fixtures f
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE f.id = fixture_id
            AND is_org_admin(t.organisation_id)
        )
    );

-- ============================================
-- FIXTURE TEAM PLAYERS
-- ============================================

-- Anyone can view fixture team players
CREATE POLICY "Fixture team players are viewable by everyone"
    ON fixture_team_players FOR SELECT
    USING (true);

-- Org admins can manage fixture team players
CREATE POLICY "Organisation admins can manage fixture team players"
    ON fixture_team_players FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM fixture_teams ft
            JOIN fixtures f ON f.id = ft.fixture_id
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE ft.id = fixture_team_id
            AND is_org_admin(t.organisation_id)
        )
    );

-- ============================================
-- MATCH SCORES
-- ============================================

-- Anyone can view match scores
CREATE POLICY "Match scores are viewable by everyone"
    ON match_scores FOR SELECT
    USING (true);

-- Scorers can update match scores
CREATE POLICY "Scorers can update match scores"
    ON match_scores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM fixtures f
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE f.id = fixture_id
            AND is_org_scorer(t.organisation_id)
        )
    );

-- System can insert match scores (via trigger)
CREATE POLICY "System can insert match scores"
    ON match_scores FOR INSERT
    WITH CHECK (true);

-- ============================================
-- SET SCORES
-- ============================================

-- Anyone can view set scores
CREATE POLICY "Set scores are viewable by everyone"
    ON set_scores FOR SELECT
    USING (true);

-- Scorers can manage set scores
CREATE POLICY "Scorers can manage set scores"
    ON set_scores FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM match_scores ms
            JOIN fixtures f ON f.id = ms.fixture_id
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE ms.id = match_score_id
            AND is_org_scorer(t.organisation_id)
        )
    );

-- ============================================
-- SCORE EVENTS
-- ============================================

-- Anyone can view score events
CREATE POLICY "Score events are viewable by everyone"
    ON score_events FOR SELECT
    USING (true);

-- Scorers can insert score events
CREATE POLICY "Scorers can insert score events"
    ON score_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM fixtures f
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE f.id = fixture_id
            AND is_org_scorer(t.organisation_id)
        )
    );

-- Scorers can delete score events (for undo)
CREATE POLICY "Scorers can delete score events"
    ON score_events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM fixtures f
            JOIN tournaments t ON t.id = f.tournament_id
            WHERE f.id = fixture_id
            AND is_org_scorer(t.organisation_id)
        )
    );
