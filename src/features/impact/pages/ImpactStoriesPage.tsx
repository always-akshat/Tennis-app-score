import { useState, useMemo } from 'react';
import { Input } from '@/components/ui';
import { StoryCard } from '../components';
import { MOCK_STORIES } from '../data/mockData';

export function ImpactStoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState<string>('all');

  const sports = useMemo(() => {
    const set = new Set(MOCK_STORIES.map((s) => s.sport));
    return [...set].sort();
  }, []);

  const filteredStories = useMemo(() => {
    return MOCK_STORIES
      .filter((story) => story.isPublished)
      .filter((story) => {
        if (filterSport !== 'all' && story.sport !== filterSport) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            story.title.toLowerCase().includes(query) ||
            story.summary.toLowerCase().includes(query) ||
            story.tags.some((t) => t.toLowerCase().includes(query)) ||
            story.district.toLowerCase().includes(query) ||
            story.state.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [searchQuery, filterSport]);

  const totalImpacted = MOCK_STORIES
    .filter((s) => s.isPublished)
    .reduce((sum, s) => sum + s.participantsImpacted, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impact Stories</h1>
        <p className="text-gray-600 mt-1">
          Real stories of transformation through sports. {totalImpacted.toLocaleString('en-IN')} lives impacted and counting.
        </p>
      </div>

      {/* Featured quote */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 border border-primary-100">
        <blockquote className="text-lg text-gray-800 italic">
          "Sport has the power to change the world. It has the power to inspire. It has the power
          to unite people in a way that little else does."
        </blockquote>
        <p className="text-sm text-gray-600 mt-2">- Nelson Mandela</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search stories by title, tag, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
          value={filterSport}
          onChange={(e) => setFilterSport(e.target.value)}
        >
          <option value="all">All Sports</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>{sport}</option>
          ))}
        </select>
      </div>

      {/* Stories grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-600">No stories match your search</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Share your story CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-primary-700 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Share Your Story</h2>
        <p className="text-purple-100 max-w-2xl mx-auto">
          Has sports changed your community? Has a volunteer transformed young lives?
          Your story could inspire thousands to take action. Every story matters.
        </p>
      </div>
    </div>
  );
}
