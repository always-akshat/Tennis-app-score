import { describe, it, expect } from 'vitest';
import {
  MOCK_COMMUNITIES,
  MOCK_ISSUES,
  MOCK_VOLUNTEERS,
  MOCK_STORIES,
  computeImpactStats,
  computeStateWiseStats,
  getMonthlyGrowth,
} from '@/features/impact/data/mockData';

describe('Impact Mock Data', () => {
  describe('MOCK_COMMUNITIES', () => {
    it('has valid communities with required fields', () => {
      expect(MOCK_COMMUNITIES.length).toBeGreaterThan(0);

      for (const community of MOCK_COMMUNITIES) {
        expect(community.id).toBeTruthy();
        expect(community.name).toBeTruthy();
        expect(community.district).toBeTruthy();
        expect(community.state).toBeTruthy();
        expect(community.totalYouth).toBeGreaterThanOrEqual(0);
        expect(community.girlsParticipation).toBeGreaterThanOrEqual(0);
        expect(community.boysParticipation).toBeGreaterThanOrEqual(0);
      }
    });

    it('has consistent participation numbers', () => {
      for (const community of MOCK_COMMUNITIES) {
        expect(community.girlsParticipation + community.boysParticipation)
          .toBe(community.totalYouth);
      }
    });

    it('spans multiple states', () => {
      const states = new Set(MOCK_COMMUNITIES.map((c) => c.state));
      expect(states.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('MOCK_ISSUES', () => {
    it('has valid issues with required fields', () => {
      expect(MOCK_ISSUES.length).toBeGreaterThan(0);

      for (const issue of MOCK_ISSUES) {
        expect(issue.id).toBeTruthy();
        expect(issue.title).toBeTruthy();
        expect(issue.description).toBeTruthy();
        expect(issue.category).toBeTruthy();
        expect(issue.status).toBeTruthy();
        expect(issue.district).toBeTruthy();
        expect(issue.state).toBeTruthy();
        expect(issue.reporterName).toBeTruthy();
        expect(issue.upvotes).toBeGreaterThanOrEqual(0);
      }
    });

    it('has issues in multiple statuses', () => {
      const statuses = new Set(MOCK_ISSUES.map((i) => i.status));
      expect(statuses.size).toBeGreaterThanOrEqual(3);
    });

    it('resolved issues have resolvedAt date', () => {
      const resolvedIssues = MOCK_ISSUES.filter((i) => i.status === 'resolved');
      for (const issue of resolvedIssues) {
        expect(issue.resolvedAt).not.toBeNull();
      }
    });

    it('open issues have no resolvedAt date', () => {
      const openIssues = MOCK_ISSUES.filter((i) => i.status === 'open');
      for (const issue of openIssues) {
        expect(issue.resolvedAt).toBeNull();
      }
    });
  });

  describe('MOCK_VOLUNTEERS', () => {
    it('has valid volunteers with required fields', () => {
      expect(MOCK_VOLUNTEERS.length).toBeGreaterThan(0);

      for (const volunteer of MOCK_VOLUNTEERS) {
        expect(volunteer.id).toBeTruthy();
        expect(volunteer.displayName).toBeTruthy();
        expect(volunteer.skills.length).toBeGreaterThan(0);
        expect(volunteer.bio).toBeTruthy();
        expect(volunteer.district).toBeTruthy();
        expect(volunteer.state).toBeTruthy();
        expect(volunteer.hoursPerWeek).toBeGreaterThan(0);
      }
    });

    it('all volunteers have at least one skill', () => {
      for (const volunteer of MOCK_VOLUNTEERS) {
        expect(volunteer.skills.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('verified volunteers have logged hours', () => {
      const verified = MOCK_VOLUNTEERS.filter((v) => v.isVerified);
      expect(verified.length).toBeGreaterThan(0);
      for (const v of verified) {
        expect(v.totalHoursLogged).toBeGreaterThan(0);
      }
    });
  });

  describe('MOCK_STORIES', () => {
    it('has valid stories with required fields', () => {
      expect(MOCK_STORIES.length).toBeGreaterThan(0);

      for (const story of MOCK_STORIES) {
        expect(story.id).toBeTruthy();
        expect(story.title).toBeTruthy();
        expect(story.summary).toBeTruthy();
        expect(story.body).toBeTruthy();
        expect(story.authorName).toBeTruthy();
        expect(story.sport).toBeTruthy();
        expect(story.participantsImpacted).toBeGreaterThan(0);
      }
    });

    it('published stories have a publishedAt date', () => {
      const published = MOCK_STORIES.filter((s) => s.isPublished);
      expect(published.length).toBeGreaterThan(0);
      for (const story of published) {
        expect(story.publishedAt).not.toBeNull();
      }
    });
  });
});

describe('computeImpactStats', () => {
  it('returns correct total youth count', () => {
    const stats = computeImpactStats();
    const expectedTotal = MOCK_COMMUNITIES.reduce((sum, c) => sum + c.totalYouth, 0);
    expect(stats.totalYouthReached).toBe(expectedTotal);
  });

  it('returns correct gender breakdown', () => {
    const stats = computeImpactStats();
    const expectedGirls = MOCK_COMMUNITIES.reduce((sum, c) => sum + c.girlsParticipation, 0);
    const expectedBoys = MOCK_COMMUNITIES.reduce((sum, c) => sum + c.boysParticipation, 0);
    expect(stats.girlsParticipation).toBe(expectedGirls);
    expect(stats.boysParticipation).toBe(expectedBoys);
    expect(stats.girlsParticipation + stats.boysParticipation).toBe(stats.totalYouthReached);
  });

  it('calculates gender ratio correctly', () => {
    const stats = computeImpactStats();
    const expectedRatio = Math.round(
      (stats.girlsParticipation / stats.totalYouthReached) * 100
    );
    expect(stats.genderRatio).toBe(expectedRatio);
  });

  it('counts open and resolved issues correctly', () => {
    const stats = computeImpactStats();
    expect(stats.openIssues).toBe(MOCK_ISSUES.filter((i) => i.status === 'open').length);
    expect(stats.resolvedIssues).toBe(MOCK_ISSUES.filter((i) => i.status === 'resolved').length);
  });

  it('counts unique states and districts', () => {
    const stats = computeImpactStats();
    const uniqueStates = new Set(MOCK_COMMUNITIES.map((c) => c.state));
    const uniqueDistricts = new Set(MOCK_COMMUNITIES.map((c) => c.district));
    expect(stats.statesReached).toBe(uniqueStates.size);
    expect(stats.districtsReached).toBe(uniqueDistricts.size);
  });

  it('counts published stories correctly', () => {
    const stats = computeImpactStats();
    expect(stats.storiesPublished).toBe(MOCK_STORIES.filter((s) => s.isPublished).length);
  });

  it('sums volunteer hours correctly', () => {
    const stats = computeImpactStats();
    const expectedHours = MOCK_VOLUNTEERS.reduce((sum, v) => sum + v.totalHoursLogged, 0);
    expect(stats.totalHoursVolunteered).toBe(expectedHours);
  });
});

describe('computeStateWiseStats', () => {
  it('returns one entry per state that has communities', () => {
    const stateStats = computeStateWiseStats();
    const uniqueStates = new Set(MOCK_COMMUNITIES.map((c) => c.state));
    expect(stateStats.length).toBe(uniqueStates.size);
  });

  it('is sorted by youth reached descending', () => {
    const stateStats = computeStateWiseStats();
    for (let i = 1; i < stateStats.length; i++) {
      expect(stateStats[i - 1].youthReached).toBeGreaterThanOrEqual(stateStats[i].youthReached);
    }
  });

  it('sums communities per state correctly', () => {
    const stateStats = computeStateWiseStats();
    for (const stat of stateStats) {
      const expected = MOCK_COMMUNITIES.filter((c) => c.state === stat.state).length;
      expect(stat.communities).toBe(expected);
    }
  });

  it('sums youth per state correctly', () => {
    const stateStats = computeStateWiseStats();
    for (const stat of stateStats) {
      const expected = MOCK_COMMUNITIES
        .filter((c) => c.state === stat.state)
        .reduce((sum, c) => sum + c.totalYouth, 0);
      expect(stat.youthReached).toBe(expected);
    }
  });
});

describe('getMonthlyGrowth', () => {
  it('returns monthly data with increasing youth reach', () => {
    const growth = getMonthlyGrowth();
    expect(growth.length).toBeGreaterThan(0);

    for (let i = 1; i < growth.length; i++) {
      expect(growth[i].youthReached).toBeGreaterThanOrEqual(growth[i - 1].youthReached);
    }
  });

  it('girls count is always less than or equal to total youth', () => {
    const growth = getMonthlyGrowth();
    for (const month of growth) {
      expect(month.girlsReached).toBeLessThanOrEqual(month.youthReached);
    }
  });

  it('has valid month labels', () => {
    const growth = getMonthlyGrowth();
    for (const month of growth) {
      expect(month.month).toMatch(/\w+ \d{4}/);
    }
  });
});
