import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@/components/ui';

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Real-Time Sports Scoring
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Track tennis, pickleball, and more with live scores that update instantly.
          Perfect for tournaments, clubs, and recreational play.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/tournaments">
            <Button size="lg">View Tournaments</Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          title="Live Scoring"
          description="Update scores in real-time. Spectators see changes instantly on their devices."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Multiple Sports"
          description="Support for tennis, pickleball, and more. Each with accurate scoring rules."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Tournament Ready"
          description="Organize brackets, track matches, and manage player registrations."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          }
        />
      </div>

      {/* Supported sports */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Sports</h2>
        <div className="flex justify-center gap-8 flex-wrap">
          <SportBadge name="Tennis" />
          <SportBadge name="Pickleball" />
          <SportBadge name="Padel" comingSoon />
          <SportBadge name="Badminton" comingSoon />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

interface SportBadgeProps {
  name: string;
  comingSoon?: boolean;
}

function SportBadge({ name, comingSoon }: SportBadgeProps) {
  return (
    <div
      className={`px-6 py-3 rounded-lg font-medium ${
        comingSoon
          ? 'bg-gray-100 text-gray-500'
          : 'bg-primary-100 text-primary-700'
      }`}
    >
      {name}
      {comingSoon && (
        <span className="block text-xs mt-0.5 opacity-75">Coming soon</span>
      )}
    </div>
  );
}
