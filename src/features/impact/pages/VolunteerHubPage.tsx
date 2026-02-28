import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@/components/ui';
import { VolunteerCard, StatCard } from '../components';
import { MOCK_VOLUNTEERS, MOCK_COMMUNITIES } from '../data/mockData';
import {
  VOLUNTEER_SKILLS,
  VOLUNTEER_SKILL_LABELS,
  INDIAN_STATES,
} from '@/types/impact.types';
import type { VolunteerSkill, CreateVolunteerRequest, IndianState } from '@/types/impact.types';

export function VolunteerHubPage() {
  const [filterSkill, setFilterSkill] = useState<VolunteerSkill | 'all'>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<CreateVolunteerRequest>({
    displayName: '',
    phone: '',
    skills: [],
    bio: '',
    district: '',
    state: 'Maharashtra' as IndianState,
    availableWeekdays: false,
    availableWeekends: true,
    hoursPerWeek: 4,
  });

  const filteredVolunteers = useMemo(() => {
    return MOCK_VOLUNTEERS.filter((v) => {
      if (filterSkill !== 'all' && !v.skills.includes(filterSkill)) return false;
      if (filterState !== 'all' && v.state !== filterState) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          v.displayName.toLowerCase().includes(query) ||
          v.bio.toLowerCase().includes(query) ||
          v.district.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [filterSkill, filterState, searchQuery]);

  const totalHours = MOCK_VOLUNTEERS.reduce((sum, v) => sum + v.totalHoursLogged, 0);
  const totalCommunities = MOCK_COMMUNITIES.length;
  const activeStates = new Set(MOCK_VOLUNTEERS.map((v) => v.state));

  function handleSkillToggle(skill: VolunteerSkill) {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitted(true);
    setShowForm(false);
    setFormData({
      displayName: '',
      phone: '',
      skills: [],
      bio: '',
      district: '',
      state: 'Maharashtra' as IndianState,
      availableWeekdays: false,
      availableWeekends: true,
      hoursPerWeek: 4,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Hub</h1>
          <p className="text-gray-600 mt-1">
            Connect with coaches and volunteers who are transforming communities through sports
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Become a Volunteer'}
        </Button>
      </div>

      {/* Success */}
      {formSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">
            Thank you for signing up! We'll match you with a community that needs your skills.
          </p>
          <button onClick={() => setFormSubmitted(false)} className="ml-auto text-green-600 hover:text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Registration Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Volunteer Registration</h2>
            <p className="text-sm text-gray-500">Share your skills with communities that need them most</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Your name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {VOLUNTEER_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.skills.includes(skill)
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {VOLUNTEER_SKILL_LABELS[skill]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About You</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Tell us about your experience, passion, and why you want to volunteer..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value as IndianState })}
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="District"
                  placeholder="e.g., Mumbai"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
                <Input
                  label="Hours per Week"
                  type="number"
                  min={1}
                  max={40}
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) || 4 })}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.availableWeekdays}
                    onChange={(e) => setFormData({ ...formData, availableWeekdays: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Available weekdays</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.availableWeekends}
                    onChange={(e) => setFormData({ ...formData, availableWeekends: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Available weekends</span>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Register as Volunteer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Volunteers"
          value={MOCK_VOLUNTEERS.length}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          label="Total Hours"
          value={totalHours}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Communities Served"
          value={totalCommunities}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="States Active"
          value={activeStates.size}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value as VolunteerSkill | 'all')}
        >
          <option value="all">All Skills</option>
          {VOLUNTEER_SKILLS.map((skill) => (
            <option key={skill} value={skill}>{VOLUNTEER_SKILL_LABELS[skill]}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
        >
          <option value="all">All States</option>
          {[...activeStates].sort().map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Volunteer list */}
      <div className="space-y-4">
        {filteredVolunteers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600">No volunteers match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredVolunteers.map((volunteer) => (
            <VolunteerCard key={volunteer.id} volunteer={volunteer} />
          ))
        )}
      </div>

      {/* Need more volunteers CTA */}
      <div className="bg-blue-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Every Community Needs a Coach
        </h3>
        <p className="text-sm text-blue-700 max-w-xl mx-auto mb-4">
          There are thousands of communities across India where children have the passion but no one to guide them.
          Your 2 hours a week could change a child's life.
        </p>
        <Button onClick={() => setShowForm(true)}>
          Sign Up to Volunteer
        </Button>
      </div>
    </div>
  );
}
