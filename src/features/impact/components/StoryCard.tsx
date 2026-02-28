import { Card, CardContent } from '@/components/ui';
import type { StoryCardProps } from '@/types/impact.types';

export function StoryCard({ story }: StoryCardProps) {
  const publishedDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Cover image placeholder */}
      <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center relative">
        <div className="text-center text-white px-4">
          <p className="text-sm font-medium opacity-80">{story.sport}</p>
          <p className="text-2xl font-bold">{story.participantsImpacted.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-70">lives impacted</p>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
            {story.district}, {story.state}
          </span>
        </div>
      </div>

      <CardContent className="py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {story.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {story.summary}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {story.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Author and date */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{story.authorName}</span>
          {publishedDate && <span>{publishedDate}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
