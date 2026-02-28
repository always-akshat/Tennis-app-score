-- ============================================
-- KHEL SATHI - SOCIAL IMPACT SCHEMA
-- Sports for Social Good in India
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE issue_category AS ENUM (
    'broken_facility', 'no_equipment', 'safety_hazard',
    'waterlogged', 'encroachment', 'no_lighting',
    'accessibility', 'other'
);

CREATE TYPE issue_status AS ENUM (
    'open', 'acknowledged', 'in_progress', 'resolved', 'closed'
);

-- ============================================
-- COMMUNITIES (PROGRAM LOCATIONS)
-- ============================================

CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    total_youth INTEGER NOT NULL DEFAULT 0,
    girls_participation INTEGER NOT NULL DEFAULT 0,
    boys_participation INTEGER NOT NULL DEFAULT 0,
    active_sports TEXT[] DEFAULT '{}',
    facilities_available TEXT[] DEFAULT '{}',
    volunteers_assigned INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY ISSUES
-- ============================================

CREATE TABLE community_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category issue_category NOT NULL,
    status issue_status NOT NULL DEFAULT 'open',
    location VARCHAR(500) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL DEFAULT '',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    photo_url TEXT,
    reported_by UUID REFERENCES players(id),
    reporter_name VARCHAR(100) NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUNTEERS
-- ============================================

CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    skills TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT NOT NULL DEFAULT '',
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    available_weekdays BOOLEAN NOT NULL DEFAULT TRUE,
    available_weekends BOOLEAN NOT NULL DEFAULT TRUE,
    hours_per_week INTEGER NOT NULL DEFAULT 4,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    total_hours_logged INTEGER NOT NULL DEFAULT 0,
    communities_served INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUNTEER-COMMUNITY ASSIGNMENTS
-- ============================================

CREATE TABLE volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'coach',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(volunteer_id, community_id)
);

-- ============================================
-- IMPACT STORIES
-- ============================================

CREATE TABLE impact_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    cover_image_url TEXT,
    author_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL DEFAULT 'multi-sport',
    participants_impacted INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ISSUE UPVOTES (prevent duplicate votes)
-- ============================================

CREATE TABLE issue_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_communities_state ON communities(state);
CREATE INDEX idx_communities_district ON communities(district);
CREATE INDEX idx_communities_active ON communities(is_active);

CREATE INDEX idx_community_issues_status ON community_issues(status);
CREATE INDEX idx_community_issues_category ON community_issues(category);
CREATE INDEX idx_community_issues_state ON community_issues(state);
CREATE INDEX idx_community_issues_district ON community_issues(district);
CREATE INDEX idx_community_issues_created ON community_issues(created_at DESC);

CREATE INDEX idx_volunteers_state ON volunteers(state);
CREATE INDEX idx_volunteers_district ON volunteers(district);
CREATE INDEX idx_volunteers_verified ON volunteers(is_verified);
CREATE INDEX idx_volunteers_skills ON volunteers USING GIN(skills);

CREATE INDEX idx_impact_stories_published ON impact_stories(is_published);
CREATE INDEX idx_impact_stories_state ON impact_stories(state);
CREATE INDEX idx_impact_stories_published_at ON impact_stories(published_at DESC);

CREATE INDEX idx_volunteer_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_volunteer_assignments_community ON volunteer_assignments(community_id);
CREATE INDEX idx_volunteer_assignments_active ON volunteer_assignments(is_active);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_issues_updated_at
    BEFORE UPDATE ON community_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at
    BEFORE UPDATE ON volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impact_stories_updated_at
    BEFORE UPDATE ON impact_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
