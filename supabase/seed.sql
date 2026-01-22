-- ============================================
-- SEED DATA FOR DEVELOPMENT
-- ============================================

-- Create a test organisation
INSERT INTO organisations (id, name, slug)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Tennis Club Demo',
    'tennis-club-demo'
);

-- Create some test players (these won't have auth users)
INSERT INTO players (id, display_name, email)
VALUES
    ('22222222-2222-2222-2222-222222222221', 'Alice Johnson', 'alice@example.com'),
    ('22222222-2222-2222-2222-222222222222', 'Bob Smith', 'bob@example.com'),
    ('22222222-2222-2222-2222-222222222223', 'Carol Davis', 'carol@example.com'),
    ('22222222-2222-2222-2222-222222222224', 'David Wilson', 'david@example.com'),
    ('22222222-2222-2222-2222-222222222225', 'Eve Brown', 'eve@example.com'),
    ('22222222-2222-2222-2222-222222222226', 'Frank Miller', 'frank@example.com'),
    ('22222222-2222-2222-2222-222222222227', 'Grace Lee', 'grace@example.com'),
    ('22222222-2222-2222-2222-222222222228', 'Henry Taylor', 'henry@example.com');

-- Create a test tournament
INSERT INTO tournaments (id, organisation_id, name, slug, sport, format, status, is_doubles, scoring_config)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Summer Open 2026',
    'summer-open-2026',
    'tennis',
    'single_elimination',
    'in_progress',
    false,
    '{
        "sport": "tennis",
        "setsToWin": 2,
        "gamesPerSet": 6,
        "tiebreakAt": 6,
        "finalSetTiebreak": true,
        "finalSetTiebreakPoints": 10,
        "advantageScoring": true,
        "winByTwo": true,
        "rallyScoring": false
    }'::jsonb
);

-- Register players for the tournament
INSERT INTO tournament_players (tournament_id, player_id, seed_number)
VALUES
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', 1),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 2),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', 3),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222224', 4),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222225', 5),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222226', 6),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222227', 7),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222228', 8);

-- Create round 1 fixtures (quarterfinals)
INSERT INTO fixtures (id, tournament_id, round_number, match_number, court_name, status)
VALUES
    ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 1, 1, 'Court 1', 'in_progress'),
    ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 1, 2, 'Court 2', 'scheduled'),
    ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 1, 3, 'Court 3', 'scheduled'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 1, 4, 'Court 4', 'scheduled');

-- Create round 2 fixtures (semifinals)
INSERT INTO fixtures (id, tournament_id, round_number, match_number, court_name, status)
VALUES
    ('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333333', 2, 1, 'Court 1', 'scheduled'),
    ('44444444-4444-4444-4444-444444444446', '33333333-3333-3333-3333-333333333333', 2, 2, 'Court 2', 'scheduled');

-- Create final
INSERT INTO fixtures (id, tournament_id, round_number, match_number, court_name, status)
VALUES
    ('44444444-4444-4444-4444-444444444447', '33333333-3333-3333-3333-333333333333', 3, 1, 'Center Court', 'scheduled');

-- Set up bracket progression
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444445' WHERE id = '44444444-4444-4444-4444-444444444441';
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444445' WHERE id = '44444444-4444-4444-4444-444444444442';
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444446' WHERE id = '44444444-4444-4444-4444-444444444443';
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444446' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444447' WHERE id = '44444444-4444-4444-4444-444444444445';
UPDATE fixtures SET winner_advances_to = '44444444-4444-4444-4444-444444444447' WHERE id = '44444444-4444-4444-4444-444444444446';

-- Create fixture teams for round 1
-- Match 1: Alice vs Henry
INSERT INTO fixture_teams (id, fixture_id, team_position)
VALUES
    ('55555555-5555-5555-5555-555555555511', '44444444-4444-4444-4444-444444444441', 1),
    ('55555555-5555-5555-5555-555555555512', '44444444-4444-4444-4444-444444444441', 2);

INSERT INTO fixture_team_players (fixture_team_id, player_id)
VALUES
    ('55555555-5555-5555-5555-555555555511', '22222222-2222-2222-2222-222222222221'),
    ('55555555-5555-5555-5555-555555555512', '22222222-2222-2222-2222-222222222228');

-- Match 2: Bob vs Grace
INSERT INTO fixture_teams (id, fixture_id, team_position)
VALUES
    ('55555555-5555-5555-5555-555555555521', '44444444-4444-4444-4444-444444444442', 1),
    ('55555555-5555-5555-5555-555555555522', '44444444-4444-4444-4444-444444444442', 2);

INSERT INTO fixture_team_players (fixture_team_id, player_id)
VALUES
    ('55555555-5555-5555-5555-555555555521', '22222222-2222-2222-2222-222222222222'),
    ('55555555-5555-5555-5555-555555555522', '22222222-2222-2222-2222-222222222227');

-- Match 3: Carol vs Frank
INSERT INTO fixture_teams (id, fixture_id, team_position)
VALUES
    ('55555555-5555-5555-5555-555555555531', '44444444-4444-4444-4444-444444444443', 1),
    ('55555555-5555-5555-5555-555555555532', '44444444-4444-4444-4444-444444444443', 2);

INSERT INTO fixture_team_players (fixture_team_id, player_id)
VALUES
    ('55555555-5555-5555-5555-555555555531', '22222222-2222-2222-2222-222222222223'),
    ('55555555-5555-5555-5555-555555555532', '22222222-2222-2222-2222-222222222226');

-- Match 4: David vs Eve
INSERT INTO fixture_teams (id, fixture_id, team_position)
VALUES
    ('55555555-5555-5555-5555-555555555541', '44444444-4444-4444-4444-444444444444', 1),
    ('55555555-5555-5555-5555-555555555542', '44444444-4444-4444-4444-444444444444', 2);

INSERT INTO fixture_team_players (fixture_team_id, player_id)
VALUES
    ('55555555-5555-5555-5555-555555555541', '22222222-2222-2222-2222-222222222224'),
    ('55555555-5555-5555-5555-555555555542', '22222222-2222-2222-2222-222222222225');

-- Update match score for the in-progress match
UPDATE match_scores
SET
    current_game_team1 = 3,
    current_game_team2 = 2,
    current_point_team1 = '30',
    current_point_team2 = '15',
    serving_team = 1
WHERE fixture_id = '44444444-4444-4444-4444-444444444441';
