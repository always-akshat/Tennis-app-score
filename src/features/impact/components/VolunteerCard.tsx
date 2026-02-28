import { Card, CardContent, Button } from '@/components/ui';
import { VOLUNTEER_SKILL_LABELS } from '@/types/impact.types';
import type { VolunteerCardProps } from '@/types/impact.types';

export function VolunteerCard({ volunteer, onConnect }: VolunteerCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-lg">
              {volunteer.displayName.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name and verification */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {volunteer.displayName}
              </h3>
              {volunteer.isVerified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Location */}
            <p className="text-sm text-gray-500 mb-2">
              {volunteer.district}, {volunteer.state}
            </p>

            {/* Bio */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {volunteer.bio}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {volunteer.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700"
                >
                  {VOLUNTEER_SKILL_LABELS[skill]}
                </span>
              ))}
              {volunteer.skills.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  +{volunteer.skills.length - 3} more
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {volunteer.totalHoursLogged.toLocaleString('en-IN')} hrs logged
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {volunteer.communitiesServed} communities
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {volunteer.availableWeekdays && volunteer.availableWeekends
                  ? 'All week'
                  : volunteer.availableWeekends
                    ? 'Weekends'
                    : 'Weekdays'}
                {' '}({volunteer.hoursPerWeek}h/wk)
              </span>
            </div>

            {/* Connect button */}
            {onConnect && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onConnect(volunteer.id)}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
