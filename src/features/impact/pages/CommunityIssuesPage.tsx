import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@/components/ui';
import { IssueCard } from '../components';
import { MOCK_ISSUES } from '../data/mockData';
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_LABELS, ISSUE_STATUSES } from '@/types/impact.types';
import type { IssueCategory, IssueStatus, CreateIssueRequest, IndianState } from '@/types/impact.types';
import { INDIAN_STATES } from '@/types/impact.types';

export function CommunityIssuesPage() {
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: '',
    description: '',
    category: 'broken_facility',
    location: '',
    district: '',
    state: 'Maharashtra' as IndianState,
    pincode: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter((issue) => {
      if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
      if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.district.toLowerCase().includes(query) ||
          issue.state.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => b.upvotes - a.upvotes);
  }, [filterCategory, filterStatus, searchQuery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would call Supabase
    setFormSubmitted(true);
    setShowForm(false);
    setFormData({
      title: '',
      description: '',
      category: 'broken_facility',
      location: '',
      district: '',
      state: 'Maharashtra' as IndianState,
      pincode: '',
    });
  }

  const openCount = MOCK_ISSUES.filter((i) => i.status === 'open').length;
  const inProgressCount = MOCK_ISSUES.filter((i) => i.status === 'in_progress' || i.status === 'acknowledged').length;
  const resolvedCount = MOCK_ISSUES.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Issues</h1>
          <p className="text-gray-600 mt-1">
            Report and track problems with sports facilities in your community
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Report Issue'}
        </Button>
      </div>

      {/* Success message */}
      {formSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">
            Your issue has been reported successfully! The community and local authorities will be notified.
          </p>
          <button onClick={() => setFormSubmitted(false)} className="ml-auto text-green-600 hover:text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Report form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Report a New Issue</h2>
            <p className="text-sm text-gray-500">Help us track infrastructure problems so they get fixed</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Issue Title"
                placeholder="e.g., Tennis court net broken at community ground"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe the problem in detail. How long has it been like this? How many people are affected?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                  >
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{ISSUE_CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="District"
                  placeholder="e.g., Mumbai, Varanasi"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
                <Input
                  label="PIN Code"
                  placeholder="e.g., 400001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  pattern="[0-9]{6}"
                  maxLength={6}
                />
              </div>

              <Input
                label="Location Details"
                placeholder="e.g., Near SBI Bank, Main Road, Govandi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />

              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Report</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{openCount}</p>
          <p className="text-sm text-red-600">Open</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{inProgressCount}</p>
          <p className="text-sm text-yellow-600">In Progress</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{resolvedCount}</p>
          <p className="text-sm text-green-600">Resolved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search issues by title, location, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as IssueCategory | 'all')}
        >
          <option value="all">All Categories</option>
          {ISSUE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{ISSUE_CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as IssueStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          {ISSUE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Issues list */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">No issues match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
}
