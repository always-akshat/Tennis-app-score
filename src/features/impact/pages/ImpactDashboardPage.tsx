import { Card, CardHeader, CardContent } from '@/components/ui';
import { StatCard, GrowthChart, StateMap } from '../components';
import { computeImpactStats, computeStateWiseStats, getMonthlyGrowth, MOCK_ISSUES } from '../data/mockData';
import { Link } from 'react-router-dom';

export function ImpactDashboardPage() {
  const stats = computeImpactStats();
  const stateStats = computeStateWiseStats();
  const monthlyGrowth = getMonthlyGrowth();
  const urgentIssues = MOCK_ISSUES
    .filter((i) => i.status === 'open')
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Khel Sathi - Impact Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Sports for Social Good across India. Real communities, real impact.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Youth Reached"
          value={stats.totalYouthReached}
          change={8}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Girls Participation"
          value={`${stats.genderRatio}%`}
          change={5}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Volunteers"
          value={stats.totalVolunteers}
          change={12}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          label="Communities"
          value={stats.totalCommunities}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Hours Volunteered"
          value={stats.totalHoursVolunteered}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="States Reached"
          value={stats.statesReached}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Open Issues"
          value={stats.openIssues}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
        <StatCard
          label="Impact Stories"
          value={stats.storiesPublished}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
      </div>

      {/* Growth and State breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Growth</h2>
            <p className="text-sm text-gray-500">Youth participation and gender equity trends</p>
          </CardHeader>
          <CardContent>
            <GrowthChart data={monthlyGrowth} />
          </CardContent>
        </Card>

        {/* State Map */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">State-wise Reach</h2>
            <p className="text-sm text-gray-500">Youth reached across {stats.statesReached} states, {stats.districtsReached} districts</p>
          </CardHeader>
          <CardContent>
            <StateMap data={stateStats} />
          </CardContent>
        </Card>
      </div>

      {/* Urgent Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Urgent Issues</h2>
            <p className="text-sm text-gray-500">Most upvoted unresolved problems</p>
          </div>
          <Link
            to="/impact/issues"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {urgentIssues.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                <p className="text-xs text-gray-500">{issue.district}, {issue.state}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {issue.upvotes}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Be the Change</h2>
        <p className="text-primary-100 max-w-2xl mx-auto mb-6">
          Every child deserves a chance to play. Whether you can coach for 2 hours a week,
          report a broken facility, or share a story of impact - you can make a difference.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/impact/volunteer"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
          >
            Volunteer Now
          </Link>
          <Link
            to="/impact/issues"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors"
          >
            Report an Issue
          </Link>
        </div>
      </div>
    </div>
  );
}
